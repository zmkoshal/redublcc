import os
import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class PDFService:
    @staticmethod
    def get_logo_path():
        candidates = [
            os.path.join(os.path.dirname(__file__), '..', 'static', 'logo.png'),
            os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'logo.png'),
            os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'dist', 'logo.png'),
        ]
        for p in candidates:
            if os.path.exists(p):
                return os.path.abspath(p)
        return None

    @staticmethod
    def generate_statement_pdf(statement, transactions, allocation_categories):
        """Generates a professional corporate PDF statement for RED PUBLICIS."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(letter),
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30
        )
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=16,
            textColor=colors.HexColor('#002060'),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            textColor=colors.HexColor('#333333'),
            spaceAfter=12
        )
        
        story = []
        
        # Logo & Brand Header (Right-aligned)
        logo_path = PDFService.get_logo_path()
        if logo_path:
            try:
                logo_img = RLImage(logo_path, width=175, height=35)
                logo_img.hAlign = 'RIGHT'
                story.append(logo_img)
                story.append(Spacer(1, 8))
            except Exception as e:
                print(f"Warning: could not add logo to PDF: {e}")

        # Fallback if statement is None
        stmt_num = statement.statement_number if statement else "TEMPLATE"
        stmt_date = statement.statement_date if statement and statement.statement_date else datetime.now().strftime('%Y-%m-%d')
        due_date = statement.payment_due_date if statement and statement.payment_due_date else datetime.now().strftime('%Y-%m-%d')
        total_stmt = float(statement.total_statement_amount or 0) if statement else 0.0
        amount_paid = float(statement.amount_paid or 0) if statement else 0.0
        balance = float(statement.outstanding_balance or 0) if statement else 0.0
        status = statement.status if statement else "Draft"

        # Header Info
        story.append(Paragraph("RED PUBLICIS (COMMUNICATION ARTS)", title_style))
        story.append(Paragraph(f"<b>UBL Credit Card Statement:</b> {stmt_num} | <b>Statement Date:</b> {stmt_date} | <b>Due Date:</b> {due_date}", subtitle_style))
        
        # Summary Overview Table
        summary_data = [
            ["Total Statement", "Total Paid", "Outstanding Balance", "Status"],
            [
                f"PKR {total_stmt:,.2f}",
                f"PKR {amount_paid:,.2f}",
                f"PKR {balance:,.2f}",
                status
            ]
        ]
        summary_table = Table(summary_data, colWidths=[180, 180, 180, 180])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#F2F4F7')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC'))
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 15))

        # Transactions Table Data & Totals
        tot_usd = sum(float(t.usd_amount or 0) for t in transactions if t.usd_amount)
        tot_pkr = sum(float(t.pkr_amount or 0) for t in transactions)
        tot_adv = sum(float(t.advance_tax or 0) for t in transactions)
        tot_st = sum(float(t.sales_tax_withheld or 0) for t in transactions)
        tot_grand = sum(float(t.total_amount or 0) for t in transactions)

        table_data = [["Date", "Merchant / Party", "Allocation", "USD", "Rate", "PKR", "Adv Tax", "Sales Tax", "Total PKR"]]
        
        if not transactions:
            table_data.append([
                "-",
                "No transactions recorded yet in this statement",
                "-",
                "-",
                "-",
                "0.00",
                "0.00",
                "0.00",
                "0.00"
            ])
        else:
            for t in transactions:
                cat_name = t.allocation.code if t.allocation else "N/A"
                table_data.append([
                    t.transaction_date.strftime('%d-%b') if t.transaction_date else "-",
                    (t.merchant_name or "")[:26],
                    cat_name,
                    f"{float(t.usd_amount):,.2f}" if t.usd_amount else "-",
                    f"{float(t.exchange_rate):.2f}" if t.exchange_rate else "-",
                    f"{float(t.pkr_amount or 0):,.2f}",
                    f"{float(t.advance_tax or 0):,.2f}",
                    f"{float(t.sales_tax_withheld or 0):,.2f}",
                    f"{float(t.total_amount or 0):,.2f}"
                ])

        # 1. Grand Total Row in Transactions Table
        table_data.append([
            "GRAND TOTAL",
            "",
            "",
            f"${tot_usd:,.2f}" if tot_usd > 0 else "-",
            "-",
            f"{tot_pkr:,.2f}",
            f"{tot_adv:,.2f}",
            f"{tot_st:,.2f}",
            f"{tot_grand:,.2f}"
        ])
            
        trans_table = Table(table_data, colWidths=[55, 175, 75, 60, 50, 80, 65, 65, 95], repeatRows=1)
        trans_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#002060')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (1, 1), (1, -2), 'LEFT'),
            ('ALIGN', (2, 1), (2, -2), 'CENTER'),
            ('ALIGN', (3, 1), (-1, -2), 'RIGHT'),
            ('GRID', (0, 0), (-1, -2), 0.5, colors.HexColor('#E0E0E0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#F9FAFB')]),
            # Grand Total Row Styling
            ('SPAN', (0, -1), (2, -1)),
            ('ALIGN', (0, -1), (2, -1), 'LEFT'),
            ('ALIGN', (3, -1), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 8.5),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#002060')),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#EBF1F5')),
            ('LINEABOVE', (0, -1), (-1, -1), 1.2, colors.HexColor('#002060')),
            ('LINEBELOW', (0, -1), (-1, -1), 1.5, colors.HexColor('#002060')),
            ('TOPPADDING', (0, -1), (-1, -1), 5),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 5),
        ]))
        story.append(trans_table)
        story.append(Spacer(1, 14))

        # 2. SUMMARY AREA (Allocation Breakdown Table)
        alloc_groups = {}
        for cat in (allocation_categories or []):
            alloc_groups[cat.id] = {
                'name': cat.name,
                'code': cat.code,
                'count': 0,
                'total': 0.0
            }
        unalloc = {'name': 'CHARGE TO UNALLOCATED', 'code': 'OTHER', 'count': 0, 'total': 0.0}

        for t in transactions:
            amt = float(t.total_amount or 0.0)
            cat_id = t.allocation_id if t.allocation_id else (t.allocation.id if t.allocation else None)
            if cat_id in alloc_groups:
                alloc_groups[cat_id]['count'] += 1
                alloc_groups[cat_id]['total'] += amt
            else:
                unalloc['count'] += 1
                unalloc['total'] += amt

        summary_data = [
            ["SUMMARY (ALLOCATION BREAKDOWN)", "", "", "", ""],
            ["DETAIL", "CODE", "TXNS", "AMOUNT (PKR)", "% SHARE"]
        ]
        
        sum_denom = tot_grand if tot_grand > 0 else 1.0
        for cat_id, data in alloc_groups.items():
            pct = (data['total'] / sum_denom) * 100 if tot_grand > 0 else 0.0
            summary_data.append([
                data['name'],
                data['code'],
                str(data['count']),
                f"{data['total']:,.2f}",
                f"{pct:.1f}%"
            ])
            
        if unalloc['count'] > 0:
            pct = (unalloc['total'] / sum_denom) * 100 if tot_grand > 0 else 0.0
            summary_data.append([
                unalloc['name'],
                unalloc['code'],
                str(unalloc['count']),
                f"{unalloc['total']:,.2f}",
                f"{pct:.1f}%"
            ])
            
        summary_data.append([
            "G.TOTAL",
            "",
            str(len(transactions)),
            f"{tot_grand:,.2f}",
            "100.0%"
        ])

        summary_table = Table(summary_data, colWidths=[240, 80, 60, 130, 90], hAlign='CENTER')
        summary_table.setStyle(TableStyle([
            ('SPAN', (0, 0), (-1, 0)),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9.5),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, 0), 4),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 4),
            
            # Column headers
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#002060')),
            ('TEXTCOLOR', (0, 1), (-1, 1), colors.white),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, 1), 8),
            ('ALIGN', (0, 1), (0, 1), 'LEFT'),
            ('ALIGN', (1, 1), (2, 1), 'CENTER'),
            ('ALIGN', (3, 1), (-1, 1), 'RIGHT'),
            ('TOPPADDING', (0, 1), (-1, 1), 3),
            ('BOTTOMPADDING', (0, 1), (-1, 1), 3),
            
            # Data rows
            ('FONTNAME', (0, 2), (-1, -2), 'Helvetica'),
            ('FONTSIZE', (0, 2), (-1, -2), 8),
            ('ALIGN', (0, 2), (0, -2), 'LEFT'),
            ('ALIGN', (1, 2), (2, -2), 'CENTER'),
            ('ALIGN', (3, 2), (-1, -2), 'RIGHT'),
            ('GRID', (0, 1), (-1, -2), 0.5, colors.HexColor('#E2E8F0')),
            ('ROWBACKGROUNDS', (0, 2), (-1, -2), [colors.white, colors.HexColor('#F8FAFC')]),
            ('TOPPADDING', (0, 2), (-1, -2), 3),
            ('BOTTOMPADDING', (0, 2), (-1, -2), 3),
            
            # G.TOTAL row
            ('SPAN', (0, -1), (1, -1)),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#EBF1F5')),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#002060')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 8.5),
            ('ALIGN', (0, -1), (1, -1), 'LEFT'),
            ('ALIGN', (2, -1), (2, -1), 'CENTER'),
            ('ALIGN', (3, -1), (-1, -1), 'RIGHT'),
            ('LINEABOVE', (0, -1), (-1, -1), 1.0, colors.HexColor('#002060')),
            ('LINEBELOW', (0, -1), (-1, -1), 1.5, colors.HexColor('#002060')),
            ('TOPPADDING', (0, -1), (-1, -1), 4),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 4),
        ]))
        story.append(KeepTogether([summary_table]))
        story.append(Spacer(1, 16))

        # 3. SIGNATURE AREA (3 Executive Authorization Cards)
        sig_data = [
            ["PREPARED BY", "", "VERIFIED BY", "", "APPROVED BY"],
            ["IT Department", "", "Admin & HR", "", "Head of Finance"],
            ["", "", "", "", ""],
            ["Signature: ______________________", "", "Signature: ______________________", "", "Signature: ______________________"],
            ["Date:         ______________________", "", "Date:         ______________________", "", "Date:         ______________________"]
        ]
        sig_table = Table(
            sig_data,
            colWidths=[232, 12, 232, 12, 232],
            rowHeights=[16, 14, 26, 16, 16],
            hAlign='CENTER'
        )
        sig_table.setStyle(TableStyle([
            # Card 1 (Prepared By)
            ('BOX', (0, 0), (0, -1), 0.75, colors.HexColor('#CBD5E1')),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F8FAFC')),
            # Card 2 (Verified By)
            ('BOX', (2, 0), (2, -1), 0.75, colors.HexColor('#CBD5E1')),
            ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#F8FAFC')),
            # Card 3 (Approved By)
            ('BOX', (4, 0), (4, -1), 0.75, colors.HexColor('#CBD5E1')),
            ('BACKGROUND', (4, 0), (4, -1), colors.HexColor('#F8FAFC')),
            
            # Header Row (Row 0)
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#002060')),
            ('ALIGN', (0, 0), (0, 1), 'CENTER'),
            ('ALIGN', (2, 0), (2, 1), 'CENTER'),
            ('ALIGN', (4, 0), (4, 1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, 0), 5),
            
            # Subtitle Row (Row 1)
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, 1), 8),
            ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor('#475569')),
            ('BOTTOMPADDING', (0, 1), (-1, 1), 3),
            
            # Signature & Date Rows (Rows 3 & 4)
            ('FONTNAME', (0, 3), (-1, 4), 'Helvetica'),
            ('FONTSIZE', (0, 3), (-1, 4), 8),
            ('TEXTCOLOR', (0, 3), (-1, 4), colors.HexColor('#1E293B')),
            ('ALIGN', (0, 3), (-1, 4), 'LEFT'),
            ('LEFTPADDING', (0, 0), (0, -1), 12),
            ('RIGHTPADDING', (0, 0), (0, -1), 12),
            ('LEFTPADDING', (2, 0), (2, -1), 12),
            ('RIGHTPADDING', (2, 0), (2, -1), 12),
            ('LEFTPADDING', (4, 0), (4, -1), 12),
            ('RIGHTPADDING', (4, 0), (4, -1), 12),
            ('BOTTOMPADDING', (0, 4), (-1, 4), 6),
        ]))
        story.append(KeepTogether([sig_table]))
        def draw_page_footer(canvas, doc_obj):
            canvas.saveState()
            canvas.setFont('Helvetica', 8)
            canvas.setFillColor(colors.HexColor('#666666'))
            canvas.drawString(30, 16, "RED PUBLICIS | US Letter (8.5 x 11 in)")
            canvas.drawRightString(762, 16, f"Page {doc_obj.page}")
            canvas.restoreState()

        doc.build(story, onFirstPage=draw_page_footer, onLaterPages=draw_page_footer)
        buffer.seek(0)
        return buffer

    @staticmethod
    def generate_generic_pdf(report_title, headers, rows):
        """Generates a clean, professional ReportLab PDF for any of the 10 financial reports."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(letter),
            rightMargin=25,
            leftMargin=25,
            topMargin=25,
            bottomMargin=25
        )
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'GenTitleStyle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=15,
            textColor=colors.HexColor('#002060'),
            spaceAfter=3
        )
        subtitle_style = ParagraphStyle(
            'GenSubTitleStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            textColor=colors.HexColor('#1F4E79'),
            spaceAfter=2
        )
        date_style = ParagraphStyle(
            'GenDateStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            textColor=colors.HexColor('#666666'),
            spaceAfter=10
        )
        cell_style = ParagraphStyle(
            'CellText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#222222')
        )
        header_cell_style = ParagraphStyle(
            'HeaderCellText',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.white,
            alignment=1
        )

        story = []
        logo_path = PDFService.get_logo_path()
        if logo_path:
            try:
                logo_img = RLImage(logo_path, width=175, height=35)
                logo_img.hAlign = 'RIGHT'
                story.append(logo_img)
                story.append(Spacer(1, 6))
            except Exception as e:
                print(f"Warning: could not add logo to generic PDF: {e}")

        story.append(Paragraph("RED PUBLICIS (COMMUNICATION ARTS)", title_style))
        story.append(Paragraph(report_title, subtitle_style))
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%d-%b-%Y %H:%M')}", date_style))

        num_cols = len(headers)
        total_width = 742  # 792 - 50 margin
        col_width = total_width / max(1, num_cols)

        # Header row
        table_data = [[Paragraph(h, header_cell_style) for h in headers]]

        if not rows:
            empty_style = ParagraphStyle(
                'EmptyCellText',
                parent=styles['Normal'],
                fontName='Helvetica-Oblique',
                fontSize=9,
                textColor=colors.HexColor('#777777'),
                alignment=1
            )
            empty_row = [Paragraph("No records found for this report period.", empty_style)] + ["" for _ in range(num_cols - 1)]
            table_data.append(empty_row)
        else:
            for r in rows:
                row_cells = []
                for val in r:
                    if val is None or val == "":
                        display_str = "-"
                    elif isinstance(val, (int, float)):
                        display_str = f"{val:,.2f}"
                    else:
                        display_str = str(val)
                    row_cells.append(Paragraph(display_str, cell_style))
                table_data.append(row_cells)

        table = Table(table_data, colWidths=[col_width] * num_cols, repeatRows=1)
        t_style = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D9D9D9')),
        ]
        if not rows:
            t_style.append(('SPAN', (0, 1), (-1, 1)))
            t_style.append(('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#F8FAFC')))
        else:
            t_style.append(('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]))

        table.setStyle(TableStyle(t_style))
        story.append(table)

        def draw_page_footer(canvas, doc_obj):
            canvas.saveState()
            canvas.setFont('Helvetica', 8)
            canvas.setFillColor(colors.HexColor('#666666'))
            canvas.drawString(25, 15, "RED PUBLICIS | US Letter (8.5 x 11 in)")
            canvas.drawRightString(767, 15, f"Page {doc_obj.page}")
            canvas.restoreState()

        doc.build(story, onFirstPage=draw_page_footer, onLaterPages=draw_page_footer)
        buffer.seek(0)
        return buffer

