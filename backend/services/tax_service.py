from decimal import Decimal, ROUND_HALF_UP

class TaxService:
    # Pakistan Statutory Tax Rates under Income Tax Ordinance 2001 & Provincial Sales Tax Acts
    FBR_236Y_FILER_RATE = Decimal('0.05')       # 5% for Active Taxpayers (ATL / Filer) under Section 236Y
    FBR_236Y_NON_FILER_RATE = Decimal('0.10')   # 10% for Non-Filers (Tenth Schedule to ITO 2001)
    PRA_PUNJAB_ST_RATE = Decimal('0.16')        # 16% Punjab Sales Tax on IT / Cloud / Hosting (PRA Act 2012)
    SRB_SINDH_ST_RATE = Decimal('0.15')         # 15% Sindh Sales Tax on Services (SRB Act 2011)
    ST_WITHHOLDING_RATE = Decimal('0.05')       # 5% Standard Provincial Sales Tax Withholding
    FED_FIXED = Decimal('40.00')                # PKR 40 Federal Excise Duty on bank statements
    SMS_ALERT_FEE = Decimal('250.00')           # PKR 250 Standard SMS / Banking Charge

    @staticmethod
    def calculate_transaction_taxes(usd_amount, pkr_amount, exchange_rate, tax_rule='fbr_236y_filer', merchant='', manual_overrides=None):
        """
        Calculate taxes for a transaction based on Pakistan statutory tax rules:
        - FBR Section 236Y (5% for Filer, 10% for Non-Filer)
        - PRA / SRB 16% / 15% for IT services & web hosting
        - Combined 5% Advance Tax + 5% Sales Tax Withholding
        - Legacy Excel Sheet formula (~0.48%) for historical reconciliations
        - Bank charges & Federal Excise Duty (FED)
        """
        pkr = Decimal(str(pkr_amount or 0.0))
        usd = Decimal(str(usd_amount or 0.0))
        rate = Decimal(str(exchange_rate or 0.0))

        if usd > 0 and rate > 0 and pkr == 0:
            pkr = (usd * rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        elif usd > 0 and pkr > 0 and rate == 0:
            rate = (pkr / usd).quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)

        overrides = manual_overrides or {}
        lower_merchant = (merchant or '').lower()

        adv_tax = Decimal('0.00')
        sales_tax = Decimal('0.00')
        additional_st = Decimal('0.00')
        fed = Decimal('0.00')
        bank_charges = Decimal('0.00')
        other_taxes = Decimal('0.00')

        # Auto-calculate based on Pakistan Tax Rule
        if tax_rule == 'fbr_236y_filer':
            # FBR Section 236Y 5% Advance Tax for Active Taxpayers (ATL)
            adv_tax = (pkr * TaxService.FBR_236Y_FILER_RATE).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        elif tax_rule == 'fbr_236y_non_filer':
            # FBR Section 236Y 10% Advance Tax for Non-Filers
            adv_tax = (pkr * TaxService.FBR_236Y_NON_FILER_RATE).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        elif tax_rule == 'pra_it_16':
            # Punjab Sales Tax 16% on IT / Software / Hosting (GoDaddy, ElevenLabs)
            sales_tax = (pkr * TaxService.PRA_PUNJAB_ST_RATE).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        elif tax_rule == 'srb_st_15':
            # Sindh Sales Tax 15% on Services
            sales_tax = (pkr * TaxService.SRB_SINDH_ST_RATE).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        elif tax_rule == 'st_withheld_5':
            # 5% Provincial Sales Tax Withheld
            sales_tax = (pkr * TaxService.ST_WITHHOLDING_RATE).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        elif tax_rule == 'fbr_5_plus_st_5':
            # 5% FBR Section 236Y Advance Tax + 5% Sales Tax Withheld
            adv_tax = (pkr * TaxService.FBR_236Y_FILER_RATE).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            sales_tax = (pkr * TaxService.ST_WITHHOLDING_RATE).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        elif tax_rule == 'excel_legacy_formula':
            # Legacy Excel Row 6 Formula: =ROUND((E*99.5194341117841%*0.48056588821596%), 0)
            factor = Decimal('0.995194341117841') * Decimal('0.0048056588821596')
            calc_adv = round(float(pkr) * float(factor))
            adv_tax = Decimal(str(calc_adv))
            if 'mid-journey' in lower_merchant or 'midjourney' in lower_merchant or 'grok' in lower_merchant:
                sales_tax = adv_tax
        elif tax_rule == 'bank_charges_fed':
            bank_charges = TaxService.SMS_ALERT_FEE
            fed = TaxService.FED_FIXED
        elif tax_rule == 'exempt_local':
            adv_tax = Decimal('0.00')
            sales_tax = Decimal('0.00')

        # Apply manual overrides if provided
        if 'advance_tax' in overrides and overrides['advance_tax'] is not None:
            adv_tax = Decimal(str(overrides['advance_tax']))
        if 'sales_tax_withheld' in overrides and overrides['sales_tax_withheld'] is not None:
            sales_tax = Decimal(str(overrides['sales_tax_withheld']))
        if 'additional_sales_tax' in overrides and overrides['additional_sales_tax'] is not None:
            additional_st = Decimal(str(overrides['additional_sales_tax']))
        if 'fed_amount' in overrides and overrides['fed_amount'] is not None:
            fed = Decimal(str(overrides['fed_amount']))
        if 'bank_charges' in overrides and overrides['bank_charges'] is not None:
            bank_charges = Decimal(str(overrides['bank_charges']))
        if 'other_taxes' in overrides and overrides['other_taxes'] is not None:
            other_taxes = Decimal(str(overrides['other_taxes']))

        total_taxes = adv_tax + sales_tax + additional_st + fed + bank_charges + other_taxes
        total_amount = (pkr + total_taxes).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        return {
            'usd_amount': float(usd),
            'exchange_rate': float(rate),
            'pkr_amount': float(pkr),
            'advance_tax': float(adv_tax),
            'sales_tax_withheld': float(sales_tax),
            'additional_sales_tax': float(additional_st),
            'fed_amount': float(fed),
            'bank_charges': float(bank_charges),
            'other_taxes': float(other_taxes),
            'total_taxes': float(total_taxes),
            'total_amount': float(total_amount),
            'tax_rule_applied': tax_rule
        }

    @staticmethod
    def get_pakistan_tax_comparison(pkr_amount, merchant=''):
        """
        Returns side-by-side calculated figures for all major Pakistan tax rules
        to power bank statement top-vs-bottom tax matching.
        """
        pkr = Decimal(str(pkr_amount or 0.0))
        if pkr <= 0:
            return {}

        legacy_factor = Decimal('0.995194341117841') * Decimal('0.0048056588821596')
        legacy_val = round(float(pkr) * float(legacy_factor))

        return {
            'fbr_236y_filer': {
                'rule_code': 'fbr_236y_filer',
                'title': 'FBR Section 236Y (Active Taxpayer / Filer)',
                'rate_pct': '5.0%',
                'statutory_law': 'Income Tax Ordinance 2001, Section 236Y',
                'advance_tax': float((pkr * TaxService.FBR_236Y_FILER_RATE).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                'sales_tax_withheld': 0.0,
                'total_bill': float((pkr * Decimal('1.05')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
            },
            'fbr_236y_non_filer': {
                'rule_code': 'fbr_236y_non_filer',
                'title': 'FBR Section 236Y (Non-Filer 100% Surcharge)',
                'rate_pct': '10.0%',
                'statutory_law': 'Tenth Schedule to Income Tax Ordinance 2001',
                'advance_tax': float((pkr * TaxService.FBR_236Y_NON_FILER_RATE).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                'sales_tax_withheld': 0.0,
                'total_bill': float((pkr * Decimal('1.10')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
            },
            'pra_it_16': {
                'rule_code': 'pra_it_16',
                'title': 'PRA Punjab Sales Tax on IT / Hosting Services',
                'rate_pct': '16.0%',
                'statutory_law': 'Punjab Sales Tax on Services Act 2012 (GoDaddy, ElevenLabs)',
                'advance_tax': 0.0,
                'sales_tax_withheld': float((pkr * TaxService.PRA_PUNJAB_ST_RATE).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                'total_bill': float((pkr * Decimal('1.16')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
            },
            'srb_st_15': {
                'rule_code': 'srb_st_15',
                'title': 'SRB Sindh Sales Tax on Digital Services',
                'rate_pct': '15.0%',
                'statutory_law': 'Sindh Sales Tax on Services Act 2011',
                'advance_tax': 0.0,
                'sales_tax_withheld': float((pkr * TaxService.SRB_SINDH_ST_RATE).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                'total_bill': float((pkr * Decimal('1.15')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
            },
            'st_withheld_5': {
                'rule_code': 'st_withheld_5',
                'title': 'Provincial Sales Tax Withholding (5%)',
                'rate_pct': '5.0%',
                'statutory_law': 'Sales Tax Special Procedure (Withholding) Rules',
                'advance_tax': 0.0,
                'sales_tax_withheld': float((pkr * TaxService.ST_WITHHOLDING_RATE).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                'total_bill': float((pkr * Decimal('1.05')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
            },
            'excel_legacy_formula': {
                'rule_code': 'excel_legacy_formula',
                'title': 'Legacy Excel Sheet Formula (~0.48%)',
                'rate_pct': '~0.48%',
                'statutory_law': 'Historical Excel Formula: =ROUND(PKR*99.52%*0.48%)',
                'advance_tax': float(legacy_val),
                'sales_tax_withheld': float(legacy_val) if ('mid-journey' in merchant.lower() or 'midjourney' in merchant.lower() or 'grok' in merchant.lower()) else 0.0,
                'total_bill': float(pkr) + float(legacy_val) * (2 if ('mid-journey' in merchant.lower() or 'midjourney' in merchant.lower() or 'grok' in merchant.lower()) else 1)
            }
        }

