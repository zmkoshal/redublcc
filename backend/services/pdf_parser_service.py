import re
from datetime import datetime, date
from decimal import Decimal, ROUND_HALF_UP
import io
from pypdf import PdfReader
from models import AllocationCategory, TaxRule

class PDFParserService:
    """
    Parses credit card statement PDFs (such as UBL, HBL, Standard Chartered, etc.),
    extracts transaction lines, detects USD & PKR amounts, links or calculates
    FBR Section 236Y advance tax and provincial sales tax, and auto-assigns expense allocations.
    """

    # Keyword rules for auto-allocating corporate expenses
    ALLOCATION_KEYWORDS = {
        'RED': [
            'MIDJOURNEY', 'GOOGLE', 'OPENAI', 'CHATGPT', 'ADOBE', 'ELEVENLABS',
            'CANVA', 'NAMECHEAP', 'GODADDY', 'AWS', 'AMAZON WEB', 'GITHUB',
            'SHUTTERSTOCK', 'ENVATO', 'ZOOM', 'DROPBOX', 'MICROSOFT', 'HOSTINGER',
            'DIGITALOCEAN', 'CLOUDFLARE', 'SLACK', 'NOTION', 'FIGMA', 'FACEBOOK',
            'META ADS', 'LINKEDIN', 'HUBSPOT', 'ZOHO'
        ],
        'KKOP': [
            'KKOP', 'KALLAR KAHAR', 'OIL', 'PRESS', 'AGRO', 'MILLS', 'PETROL',
            'PSO', 'SHELL', 'TOTAL PARCO', 'ATTOCK'
        ],
        'PFDC': [
            'PFDC', 'FASHION', 'SUNSILK', 'DESIGN COUNCIL', 'LOREAL', 'TEXTILE'
        ],
        'SYED_HAMMAD': [
            'HAMMAD', 'PERSONAL', 'DIRECTOR', 'EXECUTIVE'
        ]
    }

    TAX_LINE_KEYWORDS = [
        'ADVANCE TAX', 'ADV TAX', '236Y', '236-Y', 'WITHHOLDING TAX', 'WHT',
        'SALES TAX', 'SINDH SALES', 'PUNJAB SALES', 'FED ON', 'FED CHARGES',
        'BANK CHARGES', 'SMS FEE', 'ANNUAL FEE'
    ]

    @classmethod
    def parse_statement_pdf(cls, file_stream_or_path, password=None):
        """
        Parses a PDF file and returns a structured dictionary matching the import preview API.
        """
        reader = PdfReader(file_stream_or_path)

        if reader.is_encrypted:
            if password:
                decrypted = reader.decrypt(password)
                if not decrypted:
                    raise ValueError("Incorrect password for encrypted PDF statement.")
            else:
                raise ValueError("PDF statement is password-protected. Please provide the statement password.")

        full_text = ""
        page_texts = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            page_texts.append(text)
            full_text += f"\n--- PAGE {i+1} ---\n" + text

        # 1. Detect Statement Dates from text
        detected_stmt_date, detected_due_date = cls._extract_statement_dates(full_text)

        # 2. Extract transaction candidates
        raw_candidates = cls._extract_transaction_lines(page_texts)

        # 3. Process candidate items, detect paired tax rows, apply auto-formulas
        parsed_rows, skipped_count = cls._process_and_apply_formulas(raw_candidates, detected_stmt_date)

        # 4. Calculate grand totals
        total_pkr = sum((Decimal(str(r['pkr_amount'])) for r in parsed_rows), Decimal('0.00'))
        total_adv = sum((Decimal(str(r['advance_tax'])) for r in parsed_rows), Decimal('0.00'))
        total_st = sum((Decimal(str(r['sales_tax_withheld'])) for r in parsed_rows), Decimal('0.00'))
        total_amount = sum((Decimal(str(r['total_amount'])) for r in parsed_rows), Decimal('0.00'))

        return {
            'detected_statement_date': detected_stmt_date,
            'detected_due_date': detected_due_date,
            'total_rows_found': len(parsed_rows),
            'subtotal_rows_skipped': skipped_count,
            'totals': {
                'pkr_amount': float(total_pkr),
                'advance_tax': float(total_adv),
                'sales_tax_withheld': float(total_st),
                'total_amount': float(total_amount)
            },
            'rows': parsed_rows
        }

    @classmethod
    def _extract_statement_dates(cls, text):
        """Finds statement date and payment due date in header text."""
        stmt_date = date.today().isoformat()
        due_date = date.today().isoformat()

        # Statement Date patterns: "Statement Date: 20-Sep-2026", "20/09/2026", "Billing Date: Sep 20, 2026"
        m_stmt = re.search(r'(?:Statement|Billing)\s*Date\s*[:\-]?\s*([0-9]{1,2}[\s\/\-][A-Za-z0-9]{3,}[\s\/\-][0-9]{2,4})', text, re.IGNORECASE)
        if m_stmt:
            parsed = cls._normalize_date(m_stmt.group(1))
            if parsed:
                stmt_date = parsed

        # Payment Due Date patterns: "Payment Due Date: 11-Oct-2026", "Due Date: 11/10/2026"
        m_due = re.search(r'(?:Payment\s*)?Due\s*Date\s*[:\-]?\s*([0-9]{1,2}[\s\/\-][A-Za-z0-9]{3,}[\s\/\-][0-9]{2,4})', text, re.IGNORECASE)
        if m_due:
            parsed = cls._normalize_date(m_due.group(1))
            if parsed:
                due_date = parsed

        return stmt_date, due_date

    @classmethod
    def _normalize_date(cls, raw_str):
        """Normalizes date string to YYYY-MM-DD."""
        clean = re.sub(r'[,]', '', raw_str.strip())
        formats = [
            '%d-%b-%Y', '%d-%B-%Y', '%d-%b-%y', '%d/%m/%Y', '%d/%m/%y',
            '%d-%m-%Y', '%d-%m-%y', '%d %b %Y', '%d %B %Y', '%b %d %Y',
            '%Y-%m-%d'
        ]
        for fmt in formats:
            try:
                dt = datetime.strptime(clean, fmt)
                return dt.strftime('%Y-%m-%d')
            except Exception:
                continue
        return None

    @classmethod
    def _extract_transaction_lines(cls, page_texts):
        """
        Scans PDF lines for dates and money amounts.
        Typical Pakistani bank statement lines have:
        [Date] [Post Date] [Merchant Description] [Foreign Curr & Amount optional] [PKR Amount (DR/CR)]
        """
        candidates = []

        date_prefix_regex = re.compile(
            r'^\s*([0-9]{1,2}[\s\/\-][A-Za-z]{3,}[\s\/\-]?[0-9]{0,4}|[0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})\b',
            re.IGNORECASE
        )

        amount_regex = re.compile(r'([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)\s*(?:DR|CR)?\s*$', re.IGNORECASE)
        usd_regex = re.compile(r'(?:USD|US\$|\$)\s*([0-9]+(?:\.[0-9]{2})?)|([0-9]+(?:\.[0-9]{2})?)\s*(?:USD)', re.IGNORECASE)

        for page in page_texts:
            lines = page.splitlines()
            for line in lines:
                line_str = line.strip()
                if not line_str or len(line_str) < 10:
                    continue

                # Skip header/footer noise
                lower = line_str.lower()
                if any(x in lower for x in ['page ', 'card number', 'statement date', 'credit limit', 'available limit', 'opening balance', 'closing balance', 'minimum payment']):
                    continue

                # Check if starts with a date
                date_match = date_prefix_regex.search(line_str)
                amt_match = amount_regex.search(line_str)

                if date_match and amt_match:
                    raw_date = date_match.group(1)
                    raw_amt = amt_match.group(1).replace(',', '')
                    
                    # Middle part is description & possible foreign amount
                    mid_text = line_str[date_match.end():amt_match.start()].strip()

                    # Check for USD / foreign amount in middle
                    usd_val = None
                    usd_match = usd_regex.search(mid_text)
                    if usd_match:
                        usd_str = usd_match.group(1) or usd_match.group(2)
                        try:
                            usd_val = float(usd_str)
                            # Remove USD indicator from merchant description for cleaner display
                            mid_text = usd_regex.sub('', mid_text).strip()
                        except ValueError:
                            pass

                    # Clean description from any posting date leftover
                    post_date_m = date_prefix_regex.match(mid_text)
                    if post_date_m:
                        mid_text = mid_text[post_date_m.end():].strip()

                    merchant = re.sub(r'\s+', ' ', mid_text).strip()

                    try:
                        pkr_val = float(raw_amt)
                        if pkr_val > 0 and merchant:
                            candidates.append({
                                'raw_date': raw_date,
                                'merchant': merchant,
                                'usd_amount': usd_val,
                                'pkr_amount': pkr_val,
                                'original_line': line_str
                            })
                    except ValueError:
                        continue
                else:
                    # Check if line without date prefix is a tax/charge line directly attached to previous candidate
                    if candidates and any(k in line_str.upper() for k in ['ADVANCE TAX', '236Y', 'FED ON', 'SMS FEE', 'SALES TAX']):
                        # Extract any amount from it
                        tax_amt_m = re.search(r'([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2}))', line_str)
                        if tax_amt_m:
                            try:
                                tax_val = float(tax_amt_m.group(1).replace(',', ''))
                                candidates.append({
                                    'raw_date': candidates[-1]['raw_date'],
                                    'merchant': line_str.strip(),
                                    'usd_amount': None,
                                    'pkr_amount': tax_val,
                                    'is_tax_row': True,
                                    'original_line': line_str
                                })
                            except ValueError:
                                pass

        return candidates

    @classmethod
    def _process_and_apply_formulas(cls, candidates, default_stmt_date):
        """
        Pairs tax rows with transactions or automatically computes FBR 236Y (5% / 10%),
        calculates Exchange Rate = PKR / USD, and total = SUM(PKR + Taxes).
        """
        categories = AllocationCategory.query.all()
        cat_map = {c.code.upper(): (c.id, c.name) for c in categories}
        default_cat_id, default_cat_name = cat_map.get('RED', (1, 'CHARGE TO RED'))

        results = []
        skipped_count = 0
        i = 0
        n = len(candidates)

        while i < n:
            item = candidates[i]
            merchant_upper = item['merchant'].upper()

            # Skip payment rows (e.g. PAYMENT RECEIVED / ONLINE TRANSFER TO CARD)
            if any(p in merchant_upper for p in ['PAYMENT RECEIVED', 'IBFT PAYMENT', 'AUTO DEBIT PAYMENT', 'CHEQUE DEPOSIT', 'CR ']):
                skipped_count += 1
                i += 1
                continue

            # Skip subtotal / total rows if any got parsed
            if any(s in merchant_upper for s in ['SUBTOTAL', 'GRAND TOTAL', 'TOTAL CHARGES', 'TOTAL AMOUNT DUE']):
                skipped_count += 1
                i += 1
                continue

            # If this is an orphan tax row, treat as bank charge or standalone tax
            is_orphan_tax = item.get('is_tax_row', False) or any(k in merchant_upper for k in cls.TAX_LINE_KEYWORDS)

            tx_date = cls._normalize_date(item['raw_date']) or default_stmt_date
            pkr_dec = Decimal(str(item['pkr_amount'])).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            usd_dec = Decimal(str(item['usd_amount'])).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP) if item['usd_amount'] else None

            # Formula 1: Exchange Rate = PKR / USD
            rate_dec = None
            if usd_dec and usd_dec > 0 and pkr_dec > 0:
                rate_dec = (pkr_dec / usd_dec).quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)

            # Check if next candidate is a linked tax row for this transaction
            adv_tax_dec = Decimal('0.00')
            sales_tax_dec = Decimal('0.00')
            other_tax_dec = Decimal('0.00')

            has_linked_tax = False
            if i + 1 < n:
                next_item = candidates[i + 1]
                next_upper = next_item['merchant'].upper()
                if any(k in next_upper for k in ['ADVANCE TAX', '236Y', '236-Y', 'WITHHOLDING TAX']):
                    adv_tax_dec = Decimal(str(next_item['pkr_amount'])).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                    has_linked_tax = True
                    i += 1  # consume next row
                elif any(k in next_upper for k in ['SALES TAX', 'PRA', 'SRB']):
                    sales_tax_dec = Decimal(str(next_item['pkr_amount'])).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                    has_linked_tax = True
                    i += 1

            # Formula 2: If foreign currency transaction and no tax row was explicitly paired,
            # auto-apply statutory FBR Section 236Y Advance Tax (5% Active Filer default)
            if not has_linked_tax and usd_dec and usd_dec > 0 and not is_orphan_tax:
                # FBR Section 236Y standard active filer rate is 5%
                adv_tax_dec = (pkr_dec * Decimal('0.05')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

            # Check if standalone row is FED or Bank fee
            if is_orphan_tax and not has_linked_tax:
                if any(k in merchant_upper for k in ['FED', 'EXCISE']):
                    other_tax_dec = pkr_dec
                elif any(k in merchant_upper for k in ['ADVANCE TAX', '236Y']):
                    adv_tax_dec = pkr_dec
                elif any(k in merchant_upper for k in ['SALES TAX']):
                    sales_tax_dec = pkr_dec

            # Formula 3: Total Amount = PKR + Advance Tax + Sales Tax + Other Tax
            total_dec = (pkr_dec + adv_tax_dec + sales_tax_dec + other_tax_dec).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

            # Formula 4: Entity Allocation Detection
            cat_id = default_cat_id
            cat_name = default_cat_name

            for code, keywords in cls.ALLOCATION_KEYWORDS.items():
                if any(kw in merchant_upper for kw in keywords):
                    if code in cat_map:
                        cat_id, cat_name = cat_map[code]
                        break

            results.append({
                'row_number': len(results) + 1,
                'transaction_date': tx_date,
                'merchant_name': item['merchant'],
                'description': f"Extracted from PDF statement: {item['original_line'][:60]}",
                'allocation_id': cat_id,
                'allocation_name': cat_name,
                'usd_amount': float(usd_dec) if usd_dec else None,
                'exchange_rate': float(rate_dec) if rate_dec else None,
                'pkr_amount': float(pkr_dec),
                'advance_tax': float(adv_tax_dec),
                'sales_tax_withheld': float(sales_tax_dec),
                'other_taxes': float(other_tax_dec),
                'total_amount': float(total_dec)
            })

            i += 1

        return results, skipped_count
