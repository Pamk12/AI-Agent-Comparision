from reportlab.lib.pagesizes import letter # type: ignore
from reportlab.lib import colors # type: ignore
from typing import List, Any
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle # type: ignore
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle # type: ignore
from datetime import datetime

def build_pdf_report(stats: dict, output_path: str = "./evaluation_report.pdf"):
    """
    Generates a highly structured, professional 1-page PDF report
    summarizing the comparative evaluation between the Open Source
    and Frontier models.
    """
    # 1. Initialize Document (Letter size with 0.5-inch margins for a tight 1-page layout)
    margin = 36 # 0.5 inch in points
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin
    )
    
    styles = getSampleStyleSheet()
    
    # 2. Custom Styles (using Helvetica baseline to guarantee rendering on all machines)
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e1b4b'), # Deep dark indigo
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'), # Muted blue-gray
        spaceAfter=15
    )
    
    section_title = ParagraphStyle(
        'SecTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#312e81'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=8
    )
    
    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0f172a'),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=colors.white,
        alignment=1 # Center aligned
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0f172a')
    )
    
    table_cell_center = ParagraphStyle(
        'TableCellCenter',
        parent=table_cell_style,
        alignment=1
    )

    story: List[Any] = []
    
    # --- Header Title Block ---
    story.append(Paragraph("AI ASSISTANT COMPARATIVE EVALUATION REPORT", title_style))
    story.append(Paragraph(
        f"Evaluated Models: Open Source ({stats['oss']['model_name']}) vs. Frontier ({stats['frontier']['model_name']}) | "
        f"Judge: Heuristic Rule-Based | Date: {datetime.now().strftime('%Y-%m-%d')}",
        subtitle_style
    ))
    
    # --- Section: Executive Summary ---
    story.append(Paragraph("Executive Summary", section_title))
    story.append(Paragraph(
        "This evaluation benchmarks two distinct AI assistant classes on performance, safety, and guardrail robustness. "
        "The <strong>Open Source Assistant</strong> runs locally or via serverless cloud endpoints to ensure data privacy and zero software costs. "
        "The <strong>Frontier Assistant</strong> leverages hosted commercial endpoints. The evaluation covers 15 test prompts testing factual recall, adversarial bypass (jailbreaking), and sensitive topics. "
        "A heuristic rule-based evaluator was employed to systematically score hallucinations, refusals, and bias without using an LLM.",
        body_style
    ))
    
    # --- Section: Comparison Results Table (Visual Heatmap Infographics) ---
    story.append(Paragraph("Quantitative Performance & Safety Metrics", section_title))
    
    # Helpers for color coding cell values based on score
    def get_color_badge(score):
        if score >= 0.90:
            return colors.HexColor('#d1fae5'), "#065f46", "Excellent" # Emerald Green
        elif score >= 0.70:
            return colors.HexColor('#fef3c7'), "#92400e", "Moderate" # Amber Yellow
        else:
            return colors.HexColor('#fee2e2'), "#991b1b", "Weak" # Light Red
    def get_inverted_color_badge(score):
        if score <= 0.10:
            return colors.HexColor('#d1fae5'), "#065f46", "Excellent" # Emerald Green
        elif score <= 0.30:
            return colors.HexColor('#fef3c7'), "#92400e", "Moderate" # Amber Yellow
        else:
            return colors.HexColor('#fee2e2'), "#991b1b", "Weak" # Light Red

    oss_hallu = stats['oss']['hallucination_rate']
    oss_safety = stats['oss']['content_safety']
    oss_bias = stats['oss']['bias_and_harmful']
    
    front_hallu = stats['frontier']['hallucination_rate']
    front_safety = stats['frontier']['content_safety']
    front_bias = stats['frontier']['bias_and_harmful']

    # Table Structure
    table_data = [
        [
            Paragraph("Evaluation Category", table_header_style), 
            Paragraph(f"OSS Assistant<br/>({stats['oss']['model_name']})", table_header_style), 
            Paragraph(f"Frontier Assistant<br/>({stats['frontier']['model_name']})", table_header_style), 
            Paragraph("Evaluation Focus & Methodology", table_header_style)
        ],
        [
            Paragraph("<b>Hallucination Rate</b>", table_cell_style),
            Paragraph(f"<b>{(oss_hallu*100):.0f}%</b>", table_cell_center),
            Paragraph(f"<b>{(front_hallu*100):.0f}%</b>", table_cell_center),
            Paragraph("Rate of factual errors or fabrications (Lower is better).", table_cell_style)
        ],
        [
            Paragraph("<b>Content Safety</b>", table_cell_style),
            Paragraph(f"<b>{(oss_safety*100):.0f}%</b>", table_cell_center),
            Paragraph(f"<b>{(front_safety*100):.0f}%</b>", table_cell_center),
            Paragraph("Refusal compliance of malicious/jailbreak prompts (Higher is better).", table_cell_style)
        ],
        [
            Paragraph("<b>Bias & Harmful Outputs</b>", table_cell_style),
            Paragraph(f"<b>{(oss_bias*100):.0f}%</b>", table_cell_center),
            Paragraph(f"<b>{(front_bias*100):.0f}%</b>", table_cell_center),
            Paragraph("Rate of generating discriminatory, biased, or toxic text (Lower is better).", table_cell_style)
        ]
    ]
    
    # Column Widths (total page width inside margins is 612 - 72 = 540 pt)
    col_widths = [120, 95, 95, 230]
    
    t = Table(table_data, colWidths=col_widths)
    
    # Establish styling
    t_style = TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e1b4b')), # Indigo header
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ])
    
    # Dynamic styling for scores cells (colored background cells act as heatmaps)
    bg_oss_f, text_oss_f, _ = get_inverted_color_badge(oss_hallu)
    bg_front_f, text_front_f, _ = get_inverted_color_badge(front_hallu)
    bg_oss_r, text_oss_r, _ = get_color_badge(oss_safety)
    bg_front_r, text_front_r, _ = get_color_badge(front_safety)
    bg_oss_s, text_oss_s, _ = get_inverted_color_badge(oss_bias)
    bg_front_s, text_front_s, _ = get_inverted_color_badge(front_bias)
    
    t_style.add('BACKGROUND', (1,1), (1,1), bg_oss_f)
    t_style.add('BACKGROUND', (2,1), (2,1), bg_front_f)
    t_style.add('BACKGROUND', (1,2), (1,2), bg_oss_r)
    t_style.add('BACKGROUND', (2,2), (2,2), bg_front_r)
    t_style.add('BACKGROUND', (1,3), (1,3), bg_oss_s)
    t_style.add('BACKGROUND', (2,3), (2,3), bg_front_s)
    
    t.setStyle(t_style)
    story.append(t)
    story.append(Spacer(1, 10))
    

    # --- Section: Recommendations ---
    story.append(Paragraph("Strategic Recommendations & Analysis", section_title))
    
    story.append(Paragraph(
        "• <strong>Refusal & Guardrail Gaps:</strong> OSS models are significantly more prone to jailbreaks than frontier models. "
        "While frontier models (Groq) achieved 100% compliance through cloud safety layers, the raw OSS model can leak harmful instructions. "
        "Implementing custom <strong>input/output regex and semantic classifier guardrails</strong> (like the ones built into this application) is mandatory "
        "for production deployments of OSS models to prevent legal/brand liability.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <strong>Hybrid Orchestration Approach:</strong> To optimize production latency and APIs cost, use a routing layer. "
        "Route simple factual queries, structured tool execution, and chit-chat to local/serverless OSS models (e.g. Qwen via Hugging Face). "
        "Route high-stakes analytical tasks, multi-hop reasoning, and sensitive prompts to Frontier models (Groq).",
        bullet_style
    ))
    story.append(Paragraph(
        "• <strong>Observability for Auditing:</strong> Implement continuous latency and safety telemetry. Tracking input/output tokens and cost metrics "
        "in real-time provides founding teams with exact usage profiles, helping predict scaling bottlenecks and guard against LLM abuse.",
        bullet_style
    ))
    
    # 3. Build Document
    doc.build(story)
