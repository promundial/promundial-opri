"""
OPRI™ Report Generator — Vercel Serverless Function
POST /api/generate-report
Body: { engagement_code, company, consultant, close_date }
Returns: PDF binary (application/pdf)
"""

import json, os, sys, math, io, re, unicodedata, urllib.request, urllib.error
from http.server import BaseHTTPRequestHandler
from datetime import datetime

# ── Helpers ────────────────────────────────────────────────────────────────────
def safe_filename(s):
    s = unicodedata.normalize('NFKD', s or '')
    s = s.encode('ascii', 'ignore').decode('ascii')
    s = re.sub(r'\s+', '_', s.strip())
    s = re.sub(r'[^A-Za-z0-9_\-]+', '', s)
    return s or 'Reporte'

MESES_ES = {1:'enero',2:'febrero',3:'marzo',4:'abril',5:'mayo',6:'junio',
            7:'julio',8:'agosto',9:'septiembre',10:'octubre',11:'noviembre',12:'diciembre'}

def fecha_es(dt):
    return f'{dt.day} de {MESES_ES[dt.month]} de {dt.year}'

# ── ReportLab ──────────────────────────────────────────────────────────────────
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, PageBreak, HRFlowable, KeepTogether)
from reportlab.graphics.shapes import Drawing, Wedge, Circle, String, Line, Rect
from reportlab.graphics import renderPDF
from reportlab.pdfgen import canvas as pdfcanvas
import base64 as _b64

# ── Brand colors ───────────────────────────────────────────────────────────────
GREEN      = HexColor('#1B4332')
GREEN_MID  = HexColor('#2D6A4F')
GREEN_LT   = HexColor('#40916C')
GOLD       = HexColor('#C9A84C')
GOLD_PALE  = HexColor('#F5EDD0')
CREAM      = HexColor('#F8F4EC')
CHARCOAL   = HexColor('#1A1A1A')
MUTED      = HexColor('#6B7280')
WHITE_     = HexColor('#FFFFFF')
RED_       = HexColor('#B91C1C')
ORANGE_    = HexColor('#EA580C')
AMBER_     = HexColor('#D97706')
BLUE_      = HexColor('#1D4ED8')
VIOLET_    = HexColor('#7C3AED')
TEAL_      = HexColor('#0F766E')

MATURITY_BANDS = [
    (0,   2.5,  'Crítico',        RED_),
    (2.5, 3.2,  'Vulnerable',     ORANGE_),
    (3.2, 3.8,  'Estable',        AMBER_),
    (3.8, 4.3,  'Alto Desempeño', GREEN_LT),
    (4.3, 5.01, 'World Class',    GREEN),
]
PAI_BANDS = [
    (0,   0.3,  'Alta alineación',     GREEN),
    (0.3, 0.7,  'Moderado',            AMBER_),
    (0.7, 1.2,  'Riesgo',              ORANGE_),
    (1.2, 99,   'Desconexión crítica', RED_),
]

def get_maturity(s):
    for lo, hi, label, color in MATURITY_BANDS:
        if lo <= s < hi:
            return label, color
    return 'World Class', GREEN

def get_pai_band(g):
    for lo, hi, label, color in PAI_BANDS:
        if lo <= g < hi:
            return label, color
    return 'Desconexión crítica', RED_

DIM_META = {
    'alignment':  {'es': 'Alineación Estratégica',          'en': 'Strategic Alignment',               'color': BLUE_,   'weight': 0.20},
    'execution':  {'es': 'Excelencia de Ejecución',         'en': 'Execution Excellence',              'color': GREEN,   'weight': 0.30},
    'leadership': {'es': 'Liderazgo & Efectividad Colectiva','en': 'Leadership & Collective Effectiveness','color': VIOLET_, 'weight': 0.25},
    'resilience': {'es': 'Cambio & Resiliencia',            'en': 'Change & Resilience',               'color': AMBER_,  'weight': 0.15},
    'culture':    {'es': 'Salud Organizacional & Cultura',  'en': 'Organizational Health & Culture',   'color': TEAL_,   'weight': 0.10},
}
DIM_ORDER = ['alignment','execution','leadership','resilience','culture']

# ── Logo (Promundial SVG→PNG base64) ──────────────────────────────────────────
_LOGO_B64 = "iVBORw0KGgoAAAANSUhEUgAAAZAAAABQCAYAAAA3ICPMAAAABmJLR0QA/wD/AP+gvaeTAAAgAElEQVR4nO2deZwkVZXvf+dGVWdkVVdmZEZV2zC2iIALiriAAzwY9kUURBsQZBdwlBF1XB4uOCLP5bmNDDLwdEC2BkFREZQdQVwQEXEBxHnYoI1tU5UZS1ZXRmRlxT3zR1Y1tcSN3CKrquF+P5/60MS9ce+p7sw4cc8KaDQajUaj0Wg0Go1Go9FoNBqNRqPRaDQajUaj0Wg0Go1Go9FoNBqNRqPRaDQajUaj0Wg0Go1Go9FoNBpN19BibsajoysnDWM79HO0Ysj+MxHVF3N/jUaj0aTHoiiQ2nh5Z47osww+HMCK6csVgK+N+qLzVq58wTOLIYdGo9Fo0qPnCqTmlt4iia4FMKCY8rTB4s0rCoXf9VoWjUaj0aRHTxVI1S29jYiuA9CfNI8BjyEPHrRGft1LeTQajUaTHj1TIK0qjxm0EtFoNJqti54okHaVxwxaiWg0Gs3Wg0h7wapXXktElwPoa/deAmcFi5s2u+5r0pZLo9FoNOmSqgKpeuW1BHwLwK8JOAyMv7dx+yOSjT1BiATJeya8sd3SlE2j0Wg06ZKaApmlPPoBRKZl3zHVt2JXJrqpya2SGRea+eJug4XCwwBAgEUQd2olotFoNMuXts1MccxTHgAgAWBoaGgMwFsCt3QyiC4GMDjv1ifB4tSBQuG++WsSYKGhRLRPZCuAmY3Q89YA2I4wlZckMgCkAPtk0MYVXvVJWrMmWGo5NRpNenTtRI9RHgBwa9ayD589r1YpvVxK+iWA/PQlNsP6EK1ePTF7XuCVNwB44axL5YjFQSsLhd92K2s7TIyNbSv6xZUd3OowYxOInhYCf5R1/u2AbT/dzgLVSnlPIfGv7dzDzDUQVcEYJcGjIPEkR/RItlB4qi3p2yD0R3diiLeDcRBAu0Od6wM0XioeZaafEOg7pmX9jIhku3sGnvM5gN+ePItkXfTtkcvlyu2uPx/XdS2T5B0ESjytM+SdWWv4Y/OvB175lwRa8KLG4D9nLbvJ79GcwHM+SsDRcWMkcVqmWPzD3PmlAwH6aNx8Zg4nqe9ky7LcruVyS6eC6ITYfYjPHcgPPzD72oRf2l0wfa6NLeoAPCI8Ixl/A/N6YfCjmaHhPxPRVDeyA0DVd44j5vfEj/L5WSvwuiJfm8fGhsJ+cSnFPX8J3zTz9m0dr71x4 0A4kLk1doz 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"

def _logo_img():
    from reportlab.lib.utils import ImageReader
    data = _b64.b64decode(_LOGO_B64)
    return ImageReader(io.BytesIO(data))

# ── Airtable client ────────────────────────────────────────────────────────────
def fetch_responses(eng_code):
    token   = os.environ.get('AIRTABLE_TOKEN', '')
    base_id = os.environ.get('AIRTABLE_BASE_ID', '')
    table   = 'Responses'
    if not token or not base_id:
        return []

    all_records = []
    offset = None
    while True:
        url = (f'https://api.airtable.com/v0/{base_id}/{table}'
               f'?pageSize=100'
               f'&filterByFormula=engagement_code%3D%22{eng_code}%22'
               f'&sort%5B0%5D%5Bfield%5D=timestamp&sort%5B0%5D%5Bdirection%5D=asc')
        if offset:
            url += f'&offset={offset}'
        req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read())
        except Exception as e:
            break
        for rec in data.get('records', []):
            f = rec['fields']
            all_records.append({
                'id':      f.get('response_id'),
                'survey':  f.get('survey'),
                'meta': {
                    'company': f.get('respondent_company'),
                    'name':    f.get('respondent_name'),
                    'level':   f.get('respondent_level'),
                    'area':    f.get('respondent_area'),
                    'country': f.get('respondent_country'),
                    'bu':      f.get('respondent_bu'),
                },
                'answers': json.loads(f['answers_json']) if f.get('answers_json') else {},
                'scores': {
                    'opri':       f.get('opri_score'),
                    'alignment':  f.get('alignment_score'),
                    'execution':  f.get('execution_score'),
                    'leadership': f.get('leadership_score'),
                    'resilience': f.get('resilience_score'),
                    'culture':    f.get('culture_score'),
                },
                'pai_group': f.get('pai_group'),
            })
        offset = data.get('offset')
        if not offset:
            break
    return all_records

# ── Scoring ────────────────────────────────────────────────────────────────────
CORE_DIM_QS = {
    'alignment':  ['A1','A2','A3','A4','A5'],
    'execution':  ['E1','E2','E3','E4','E5','E6','E7'],
    'leadership': ['L1','L2','L3','L4','L5','L6'],
    'resilience': ['R1','R2','R3','R4'],
    'culture':    ['C1','C2','C3'],
}
WEIGHTS = {'alignment':0.20,'execution':0.30,'leadership':0.25,'resilience':0.15,'culture':0.10}
PAI_LEAD = ['Comité Ejecutivo','Directores/Gerentes']
PAI_ORG  = ['Supervisores','Colaboradores','Otros']

def avg(vals):
    f = [v for v in vals if v is not None]
    return sum(f)/len(f) if f else None

def compute_scores(responses, dim_qs):
    if not responses:
        return None
    dim_scores = {}
    for dim, qids in dim_qs.items():
        vals = [r['answers'].get(q) for r in responses for q in qids if r['answers'].get(q) is not None]
        dim_scores[dim] = avg(vals)

    active_w = sum(WEIGHTS[d] for d in dim_scores if dim_scores[d] is not None)
    if active_w == 0:
        return None
    opri = sum(dim_scores[d] * WEIGHTS[d] / active_w for d in dim_scores if dim_scores[d] is not None)

    # PAI
    lead = [r for r in responses if r.get('meta',{}).get('level') in PAI_LEAD]
    org  = [r for r in responses if r.get('meta',{}).get('level') in PAI_ORG]
    pai_by_dim = {}
    for dim, qids in dim_qs.items():
        lv = avg([r['answers'].get(q) for r in lead for q in qids if r['answers'].get(q) is not None])
        ov = avg([r['answers'].get(q) for r in org  for q in qids if r['answers'].get(q) is not None])
        pai_by_dim[dim] = {'lead': lv, 'org': ov, 'gap': abs(lv-ov) if lv is not None and ov is not None else None}
    gap_vals = [v['gap'] for v in pai_by_dim.values() if v['gap'] is not None]
    pai_global = avg(gap_vals)

    return {'opri': opri, 'dim_scores': dim_scores, 'pai_by_dim': pai_by_dim, 'pai_global': pai_global, 'n': len(responses)}

# ── AI Interpretation ──────────────────────────────────────────────────────────
def get_ai_interpretation(company, scores):
    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    if not api_key or not scores:
        return {'summary_es': 'El análisis OPRI™ revela áreas críticas que requieren atención inmediata.',
                'summary_en': 'The OPRI™ analysis reveals critical areas requiring immediate attention.',
                'dims': {}}

    dim_ctx = ', '.join(
        f"{DIM_META[d]['en']} ({DIM_META[d]['es']}): {scores['dim_scores'].get(d, 'N/A'):.2f}/5.00"
        for d in DIM_ORDER if scores['dim_scores'].get(d) is not None
    )
    prompt = (
        f"You are an expert organizational consultant from Promundial Consulting Group.\n\n"
        f"Company: {company}\n"
        f"OPRI™ Score: {scores['opri']:.2f}/5.00 ({get_maturity(scores['opri'])[0]})\n"
        f"Respondents: {scores['n']}\n"
        f"Dimension scores: {dim_ctx}\n"
        f"PAI™: {scores['pai_global']:.2f if scores['pai_global'] else 'N/A'}\n\n"
        f"Generate a bilingual (Spanish/English) executive interpretation. Respond ONLY with valid JSON:\n"
        f'{{"summary_es":"...","summary_en":"...","dims":{{"alignment":{{"es":"...","en":"..."}},"execution":{{"es":"...","en":"..."}},"leadership":{{"es":"...","en":"..."}},"resilience":{{"es":"...","en":"..."}},"culture":{{"es":"...","en":"..."}}}}}}'
    )

    body = json.dumps({'model':'claude-sonnet-4-6','max_tokens':1500,'messages':[{'role':'user','content':prompt}]}).encode()
    req = urllib.request.Request(
        'https://api.anthropic.com/v1/messages',
        data=body,
        headers={'Content-Type':'application/json','x-api-key':api_key,'anthropic-version':'2023-06-01'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
        text = data['content'][0]['text'].strip().replace('```json','').replace('```','')
        return json.loads(text)
    except Exception:
        return {'summary_es':'El diagnóstico revela oportunidades de mejora significativas.',
                'summary_en':'The diagnosis reveals significant improvement opportunities.',
                'dims':{}}

# ── Gauge SVG ──────────────────────────────────────────────────────────────────
def make_gauge(score, color, size=90):
    d = Drawing(size, size*0.65)
    cx, cy = size/2, size*0.55
    r = size*0.38
    sw = size*0.1

    # Track arc (gray)
    from reportlab.graphics.shapes import ArcPath
    def arc_path(cx, cy, r, start_deg, end_deg, stroke, sw, fill=None):
        import math
        steps = 30
        pts = []
        for i in range(steps+1):
            a = math.radians(start_deg + (end_deg-start_deg)*i/steps)
            pts.extend([cx + r*math.cos(a), cy + r*math.sin(a)])
        from reportlab.graphics.shapes import PolyLine
        pl = PolyLine(pts, strokeColor=stroke, strokeWidth=sw, fillColor=None)
        d.add(pl)

    arc_path(cx, cy, r, 180, 0, HexColor('#E5E7EB'), sw)
    # Score arc
    pct = min(max(score/5, 0), 1)
    end_angle = 180 - pct*180
    arc_path(cx, cy, r, 180, end_angle, color, sw)

    # Score text
    d.add(String(cx, cy-size*0.08, f'{score:.2f}',
                 fontName='Helvetica-Bold', fontSize=size*0.22,
                 fillColor=color, textAnchor='middle'))
    d.add(String(cx, cy-size*0.22, '/ 5.00',
                 fontName='Helvetica', fontSize=size*0.1,
                 fillColor=MUTED, textAnchor='middle'))
    return d

# ── Numbered Canvas ────────────────────────────────────────────────────────────
class NumberedCanvas(pdfcanvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_footer(num_pages)
            super().showPage()
        super().save()

    def _draw_footer(self, total):
        self.saveState()
        self.setFont('Helvetica', 7)
        self.setFillColor(MUTED)
        pg = self._pageNumber
        w, h = A4
        self.drawString(20*mm, 10*mm, f'OPRI™ Enterprise Edition · Confidencial · © {datetime.now().year} Promundial Consulting Group')
        self.drawRightString(w-20*mm, 10*mm, f'Página {pg} de {total}')
        self.restoreState()

# ── Styles ─────────────────────────────────────────────────────────────────────
def make_styles():
    return {
        'h1': ParagraphStyle('h1', fontName='Helvetica-Bold', fontSize=22, textColor=GREEN, spaceAfter=4),
        'h2': ParagraphStyle('h2', fontName='Helvetica-Bold', fontSize=13, textColor=GREEN, spaceAfter=3, spaceBefore=12),
        'h3': ParagraphStyle('h3', fontName='Helvetica-Bold', fontSize=11, textColor=CHARCOAL, spaceAfter=2, spaceBefore=8),
        'body': ParagraphStyle('body', fontName='Helvetica', fontSize=10, textColor=CHARCOAL, leading=15, spaceAfter=6),
        'body_sm': ParagraphStyle('body_sm', fontName='Helvetica', fontSize=9, textColor=MUTED, leading=13),
        'section': ParagraphStyle('section', fontName='Helvetica-Bold', fontSize=8, textColor=MUTED,
                                  textTransform='uppercase', spaceBefore=16, spaceAfter=6,
                                  borderPadding=(0,0,4,0)),
        'white': ParagraphStyle('white', fontName='Helvetica', fontSize=10, textColor=WHITE_, leading=14),
        'white_bold': ParagraphStyle('white_bold', fontName='Helvetica-Bold', fontSize=11, textColor=WHITE_, leading=14),
        'gold': ParagraphStyle('gold', fontName='Helvetica-Bold', fontSize=8, textColor=GOLD,
                               textTransform='uppercase', leading=10),
        'center': ParagraphStyle('center', fontName='Helvetica', fontSize=10, textColor=CHARCOAL,
                                 alignment=TA_CENTER, leading=14),
    }

# ── PDF builder ────────────────────────────────────────────────────────────────
def generate_pdf(data):
    company    = data.get('company', 'Empresa')
    consultant = data.get('consultant', 'Promundial')
    eng_code   = data.get('engagement_code', '')
    date_str   = fecha_es(datetime.now())

    # Load responses from Airtable
    responses = fetch_responses(eng_code)
    core_rr  = [r for r in responses if r['survey'] == 'core']
    full_rr  = [r for r in responses if r['survey'] == 'full']

    FULL_DIM_QS = {d: CORE_DIM_QS[d] + extra for d, extra in {
        'alignment':  ['SA6','SA7','SA8','SA9','SA10','SA11','SA12'],
        'execution':  ['EX8','EX9','EX10','EX11','EX12','EX13','EX14','EX15','EX16','EX17','EX18'],
        'leadership': ['LE7','LE8','LE9','LE10','LE11','LE12','LE13','LE14','LE15'],
        'resilience': ['RC5','RC6','RC7','RC8','RC9'],
        'culture':    ['OC4','OC5','OC6'],
    }.items()}

    core_sc = compute_scores(core_rr, CORE_DIM_QS)
    full_sc = compute_scores(full_rr, FULL_DIM_QS)
    main_sc = full_sc or core_sc
    if not main_sc:
        raise ValueError('No hay respuestas suficientes para generar el reporte.')

    ai = get_ai_interpretation(company, main_sc)

    # Build PDF
    buf = io.BytesIO()
    w, h = A4
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=20*mm, rightMargin=20*mm,
                            topMargin=22*mm, bottomMargin=22*mm,
                            title=f'OPRI™ Report — {company}')
    S = make_styles()
    story = []
    mat_label, mat_color = get_maturity(main_sc['opri'])

    # ── COVER ──────────────────────────────────────────────────────────────────
    def first_page(canv, doc):
        canv.saveState()
        # Dark green background top band
        canv.setFillColor(GREEN)
        canv.rect(0, h-80*mm, w, 80*mm, fill=1, stroke=0)
        # Gold accent line
        canv.setFillColor(GOLD)
        canv.rect(0, h-82*mm, w, 2*mm, fill=1, stroke=0)
        # Logo
        try:
            img = _logo_img()
            canv.drawImage(img, 20*mm, h-52*mm, width=50*mm, height=15*mm,
                           preserveAspectRatio=True, mask='auto')
        except Exception:
            pass
        # Company name
        canv.setFillColor(WHITE_)
        canv.setFont('Helvetica-Bold', 26)
        canv.drawString(20*mm, h-65*mm, company)
        # Subtitle
        canv.setFillColor(GOLD_PALE)
        canv.setFont('Helvetica', 11)
        canv.drawString(20*mm, h-72*mm, 'Organizational Performance & Resilience Index™ · Reporte Ejecutivo')
        # Scores row
        canv.setFillColor(CREAM)
        canv.rect(20*mm, h-105*mm, w-40*mm, 18*mm, fill=1, stroke=0)
        # OPRI Score
        canv.setFillColor(mat_color)
        canv.setFont('Helvetica-Bold', 18)
        canv.drawString(25*mm, h-94*mm, f'{main_sc["opri"]:.2f}')
        canv.setFillColor(MUTED)
        canv.setFont('Helvetica', 8)
        canv.drawString(25*mm, h-100*mm, 'OPRI™ SCORE')
        # Maturity pill
        canv.setFillColor(mat_color)
        canv.roundRect(45*mm, h-98*mm, 28*mm, 6*mm, 3*mm, fill=1, stroke=0)
        canv.setFillColor(WHITE_)
        canv.setFont('Helvetica-Bold', 7)
        canv.drawCentredString(59*mm, h-95*mm, mat_label.upper())
        # N
        canv.setFillColor(CHARCOAL)
        canv.setFont('Helvetica-Bold', 18)
        canv.drawString(90*mm, h-94*mm, str(main_sc['n']))
        canv.setFillColor(MUTED)
        canv.setFont('Helvetica', 8)
        canv.drawString(90*mm, h-100*mm, 'RESPONDENTES')
        # PAI
        if main_sc.get('pai_global') is not None:
            pai_label, pai_color = get_pai_band(main_sc['pai_global'])
            canv.setFillColor(CHARCOAL)
            canv.setFont('Helvetica-Bold', 18)
            canv.drawString(115*mm, h-94*mm, f'{main_sc["pai_global"]:.2f}')
            canv.setFillColor(MUTED)
            canv.setFont('Helvetica', 8)
            canv.drawString(115*mm, h-100*mm, 'PAI™')
        # Consultant + date
        canv.setFillColor(CHARCOAL)
        canv.setFont('Helvetica-Bold', 11)
        canv.drawString(145*mm, h-94*mm, consultant)
        canv.setFillColor(MUTED)
        canv.setFont('Helvetica', 8)
        canv.drawString(145*mm, h-100*mm, date_str)
        canv.restoreState()

    def later_pages(canv, doc):
        canv.saveState()
        canv.setFillColor(GREEN)
        canv.rect(0, h-14*mm, w, 14*mm, fill=1, stroke=0)
        try:
            img = _logo_img()
            canv.drawImage(img, 20*mm, h-11*mm, width=28*mm, height=8*mm,
                           preserveAspectRatio=True, mask='auto')
        except Exception:
            pass
        canv.setFillColor(GOLD_PALE)
        canv.setFont('Helvetica', 8)
        canv.drawRightString(w-20*mm, h-9*mm, company)
        canv.restoreState()

    # Spacer for cover band
    story.append(Spacer(1, 30*mm))

    # ── EXECUTIVE SUMMARY ──────────────────────────────────────────────────────
    story.append(Paragraph('RESUMEN EJECUTIVO / EXECUTIVE SUMMARY', S['section']))
    story.append(HRFlowable(width='100%', thickness=1.5, color=GOLD, spaceAfter=8))

    summ_data = [[
        Paragraph(f'<b>ESPAÑOL</b><br/>{ai.get("summary_es","")}',
                  ParagraphStyle('sl', fontName='Helvetica', fontSize=10, textColor=CHARCOAL,
                                 leading=14, backColor=GOLD_PALE, borderPadding=8)),
        Paragraph(f'<b>ENGLISH</b><br/>{ai.get("summary_en","")}',
                  ParagraphStyle('sr', fontName='Helvetica', fontSize=10, textColor=CHARCOAL,
                                 leading=14, backColor=HexColor('#EEF2FF'), borderPadding=8)),
    ]]
    summ_t = Table(summ_data, colWidths=[83*mm, 83*mm])
    summ_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), GOLD_PALE),
        ('BACKGROUND', (1,0), (1,0), HexColor('#EEF2FF')),
        ('LEFTPADDING',  (0,0),(-1,-1), 8),
        ('RIGHTPADDING', (0,0),(-1,-1), 8),
        ('TOPPADDING',   (0,0),(-1,-1), 8),
        ('BOTTOMPADDING',(0,0),(-1,-1), 8),
        ('ROUNDEDCORNERS', [4]),
        ('VALIGN', (0,0),(-1,-1), 'TOP'),
    ]))
    story.append(summ_t)
    story.append(Spacer(1, 8*mm))

    # ── CAPABILITY PROFILE ─────────────────────────────────────────────────────
    story.append(Paragraph('PERFIL DE CAPACIDADES / CAPABILITY PROFILE', S['section']))
    story.append(HRFlowable(width='100%', thickness=1.5, color=GOLD, spaceAfter=8))

    gauge = make_gauge(main_sc['opri'], mat_color, size=100)
    gauge_t = Table([[gauge]], colWidths=[50*mm])
    gauge_t.setStyle(TableStyle([('ALIGN',(0,0),(-1,-1),'CENTER'),('VALIGN',(0,0),(-1,-1),'MIDDLE')]))

    dim_rows = [['', 'Dimensión', 'Score', 'Estado']]
    for dim in DIM_ORDER:
        sc = main_sc['dim_scores'].get(dim)
        if sc is None:
            continue
        ml, mc = get_maturity(sc)
        meta = DIM_META[dim]
        dim_rows.append([
            '',
            Paragraph(f'<b>{meta["es"]}</b><br/><font size="8" color="grey">{meta["en"]} · {int(meta["weight"]*100)}%</font>', S['body']),
            Paragraph(f'<b><font color="{mc.hexval()}">{sc:.2f}</font></b>', S['body']),
            Paragraph(f'<font size="9" color="{mc.hexval()}"><b>{ml}</b></font>', S['body']),
        ])

    dim_table = Table(dim_rows, colWidths=[3*mm, 95*mm, 18*mm, 28*mm])
    dim_ts = [
        ('BACKGROUND', (0,0), (-1,0), CREAM),
        ('FONTNAME', (0,0),(-1,0),'Helvetica-Bold'),
        ('FONTSIZE', (0,0),(-1,0), 8),
        ('TEXTCOLOR',(0,0),(-1,0), MUTED),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[WHITE_,CREAM]),
        ('LINEBELOW',(0,0),(-1,0),0.5,HexColor('#E5E7EB')),
        ('TOPPADDING',(0,0),(-1,-1),5),
        ('BOTTOMPADDING',(0,0),(-1,-1),5),
        ('LEFTPADDING',(0,0),(-1,-1),4),
    ]
    # Color left accent per dim
    for i, dim in enumerate(DIM_ORDER, 1):
        c = DIM_META[dim]['color']
        dim_ts.append(('BACKGROUND',(0,i),(0,i),c))
    dim_table.setStyle(TableStyle(dim_ts))

    profile_t = Table([[gauge_t, dim_table]], colWidths=[52*mm, 114*mm])
    profile_t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(1,0),(1,0),6)]))
    story.append(profile_t)
    story.append(Spacer(1, 8*mm))

    # ── PAI ────────────────────────────────────────────────────────────────────
    if main_sc.get('pai_global') is not None:
        story.append(Paragraph('PAI™ — PERCEPTION ALIGNMENT INDEX', S['section']))
        story.append(HRFlowable(width='100%', thickness=1.5, color=GOLD, spaceAfter=8))

        pai_label, pai_color = get_pai_band(main_sc['pai_global'])
        pai_intro = Table([[
            Paragraph(f'<font size="28" color="{pai_color.hexval()}"><b>{main_sc["pai_global"]:.2f}</b></font>', S['center']),
            Paragraph(f'<b>{pai_label} / {pai_label}</b><br/>Gap promedio entre Liderazgo y Organización', S['body']),
        ]], colWidths=[28*mm, 138*mm])
        story.append(pai_intro)
        story.append(Spacer(1, 4*mm))

        pai_rows = [['Dimensión','Liderazgo','Organización','Gap','Estado']]
        for dim in DIM_ORDER:
            p = main_sc['pai_by_dim'].get(dim, {})
            gap = p.get('gap')
            if gap is None:
                continue
            gl, gc = get_pai_band(gap)
            pai_rows.append([
                DIM_META[dim]['es'],
                f'{p["lead"]:.2f}' if p.get('lead') else '—',
                f'{p["org"]:.2f}'  if p.get('org')  else '—',
                Paragraph(f'<b><font color="{gc.hexval()}">{gap:.2f}</font></b>', S['body']),
                Paragraph(f'<font size="9" color="{gc.hexval()}"><b>{gl}</b></font>', S['body']),
            ])
        pai_t = Table(pai_rows, colWidths=[58*mm,22*mm,28*mm,18*mm,40*mm])
        pai_ts = [
            ('BACKGROUND',(0,0),(-1,0),GREEN),
            ('TEXTCOLOR',(0,0),(-1,0),GOLD),
            ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),
            ('FONTSIZE',(0,0),(-1,0),8),
            ('ROWBACKGROUNDS',(0,1),(-1,-1),[WHITE_,CREAM]),
            ('TOPPADDING',(0,0),(-1,-1),5),
            ('BOTTOMPADDING',(0,0),(-1,-1),5),
            ('LEFTPADDING',(0,0),(-1,-1),6),
            ('FONTSIZE',(0,1),(-1,-1),10),
        ]
        pai_t.setStyle(TableStyle(pai_ts))
        story.append(pai_t)
        story.append(Spacer(1, 8*mm))

    # ── DIM ANALYSIS ───────────────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph('ANÁLISIS POR DIMENSIÓN / DIMENSION ANALYSIS', S['section']))
    story.append(HRFlowable(width='100%', thickness=1.5, color=GOLD, spaceAfter=10))

    for dim in DIM_ORDER:
        sc = main_sc['dim_scores'].get(dim)
        if sc is None:
            continue
        ml, mc = get_maturity(sc)
        meta = DIM_META[dim]
        ai_dim = ai.get('dims', {}).get(dim, {})

        # Section header
        hdr = Table([[
            Paragraph(f'<font color="white"><b>{meta["es"]}</b>  ·  {meta["en"]}</font>', S['white_bold']),
            Paragraph(f'<font size="20" color="white"><b>{sc:.2f}</b></font>',
                      ParagraphStyle('sc_r', fontName='Helvetica-Bold', fontSize=18,
                                     textColor=WHITE_, alignment=TA_RIGHT)),
        ]], colWidths=[130*mm, 36*mm])
        hdr.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,-1), meta['color']),
            ('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),
            ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),
            ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ]))
        story.append(hdr)
        story.append(Spacer(1,2*mm))

        # Bar
        bar_w = 166*mm
        filled = int((sc/5)*bar_w.mm_*mm) if hasattr(bar_w,'mm_') else (sc/5)*166*mm
        bar_data = [['']]
        bar_t = Table(bar_data, colWidths=[166*mm], rowHeights=[4*mm])
        bar_t.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,-1),HexColor('#E5E7EB')),
            ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
            ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
        ]))
        story.append(bar_t)
        story.append(Spacer(1,3*mm))

        # AI text
        if ai_dim.get('es'):
            bilingual = Table([[
                Paragraph(f'<b>Español:</b> {ai_dim["es"]}', S['body']),
                Paragraph(f'<b>English:</b> {ai_dim["en"]}', S['body']),
            ]], colWidths=[83*mm, 83*mm])
            bilingual.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),4)]))
            story.append(bilingual)
        story.append(Spacer(1, 6*mm))

    # ── ROADMAP ────────────────────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph('ROADMAP DE INTERVENCIÓN / INTERVENTION ROADMAP', S['section']))
    story.append(HRFlowable(width='100%', thickness=1.5, color=GOLD, spaceAfter=10))

    sorted_dims = sorted(
        [(dim, sc) for dim, sc in main_sc['dim_scores'].items() if sc is not None],
        key=lambda x: x[1]
    )
    timings = ['INTERVENCIÓN INMEDIATA','INTERVENCIÓN A 60 DÍAS','INTERVENCIÓN A 90 DÍAS']
    for i, (dim, sc) in enumerate(sorted_dims[:3]):
        ml, mc = get_maturity(sc)
        meta = DIM_META[dim]
        timing = timings[i] if i < len(timings) else f'PRIORIDAD {i+1}'
        row = Table([[
            Paragraph(f'<b><font color="white">PRIORIDAD {i+1} — {timing}</font></b><br/>'
                      f'<font size="16" color="white"><b>{meta["es"]}  —  {sc:.2f}</b></font><br/>'
                      f'<font size="9" color="rgba(255,255,255,0.8)">{meta["en"]}</font>',
                      ParagraphStyle('rm', fontName='Helvetica', fontSize=10, textColor=WHITE_, leading=16)),
        ]], colWidths=[166*mm])
        row.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,-1),mc),
            ('LEFTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),10),
            ('BOTTOMPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),12),
            ('ROUNDEDCORNERS',[6]),
        ]))
        story.append(row)
        story.append(Spacer(1,4*mm))

    story.append(Spacer(1,10*mm))

    # ── FOOTER ─────────────────────────────────────────────────────────────────
    closing = Table([[
        Paragraph('<b>Promundial Consulting Group</b><br/>Execution Excellence at Every Level<br/>promundial.com',
                  ParagraphStyle('cl', fontName='Helvetica', fontSize=9,
                                 textColor=WHITE_, leading=13, alignment=TA_CENTER))
    ]], colWidths=[166*mm])
    closing.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1),GREEN),
        ('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10),
        ('ROUNDEDCORNERS',[6]),
    ]))
    story.append(closing)

    doc.build(story, onFirstPage=first_page, onLaterPages=later_pages, canvasmaker=NumberedCanvas)
    buf.seek(0)
    return buf.read()


# ── HTTP Handler ────────────────────────────────────────────────────────────────
class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body   = self.rfile.read(length)
            data   = json.loads(body)
            pdf    = generate_pdf(data)
            fname  = safe_filename(data.get('company','OPRI'))
            self.send_response(200)
            self.send_header('Content-Type', 'application/pdf')
            self.send_header('Content-Disposition', f'attachment; filename="OPRI_Report_{fname}.pdf"')
            self.send_header('Content-Length', str(len(pdf)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(pdf)
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        pass
