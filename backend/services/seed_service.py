import os
import openpyxl
from datetime import datetime, date
from decimal import Decimal
from models import db, User, CreditCard, Statement, Transaction, AllocationCategory, TaxRule, Payment, ReconciliationRecord, AuditLog

def seed_database():
    """Initializes the database with roles, users, allocation categories, tax rules, and initial statement."""
    # 1. Create Default Users ONLY if database is newly initialized
    if User.query.count() == 0:
        users_data = [
            ('superadmin', 'admin@red.com.pk', 'Admin@123', 'System Administrator', 'super_admin'),
            ('finance', 'finance@red.com.pk', 'Finance@123', 'Head of Finance', 'finance_hof'),
            ('itadmin', 'it@red.com.pk', 'It@123', 'IT Operations Specialist', 'it_entry'),
            ('manager', 'management@red.com.pk', 'Manager@123', 'Executive Management', 'management_readonly')
        ]
        for username, email, pwd, name, role in users_data:
            u = User(username=username, email=email, full_name=name, role=role)
            u.set_password(pwd)
            db.session.add(u)
        db.session.commit()

    # 2. Credit Card Setup (UBL)
    card = CreditCard.query.filter_by(bank_name='UBL', card_number_last4='9821').first()
    if not card:
        card = CreditCard(
            bank_name='UBL',
            card_holder_name='RED PUBLICIS (COMMUNICATION ARTS)',
            card_number_last4='9821',
            card_type='Corporate Visa Business',
            currency='PKR'
        )
        db.session.add(card)
        db.session.commit()
    else:
        card.card_holder_name = 'RED PUBLICIS (COMMUNICATION ARTS)'
        db.session.commit()

    # 3. Allocation Categories
    categories = [
        ('RED', 'CHARGE TO RED', 'Company', 'RED (Red.com.pk) corporate technology and cloud expenses', 1),
        ('KKOP', 'CHARGE TO KKOP', 'Company', 'Kallar Kahar Oil & Press / KKOP / KOOP operations', 2),
        ('PFDC', 'CHARGE TO PFDC', 'Client', 'Pakistan Fashion Design Council client-assigned services', 3),
        ('SYED_HAMMAD', 'CHARGE TO SYED HAMMAD HASAN', 'Individual', 'Syed Hammad Hasan director personal/assigned subscriptions', 4),
        ('OTHER_COMPANIES', 'CHARGE TO OTHER COMPANIES', 'Company', 'Subsidiary and partner company allocations', 5),
        ('OTHER_INDIVIDUALS', 'CHARGE TO OTHER INDIVIDUALS', 'Individual', 'Staff or contractor individual allocations', 6)
    ]
    cat_map = {}
    for code, name, etype, desc, order in categories:
        cat = AllocationCategory.query.filter_by(code=code).first()
        if not cat:
            cat = AllocationCategory(code=code, name=name, entity_type=etype, description=desc, display_order=order)
            db.session.add(cat)
            db.session.flush()
        cat_map[code] = cat
    db.session.commit()

    # 4. Tax Rules under Pakistan Law (ITO 2001, PRA 2012, SRB 2011)
    tax_rules_data = [
        ('FBR S.236Y Advance Tax (Active Filer - 5%)', 'ADVANCE_TAX', 'PERCENTAGE', Decimal('5.00'), 'ROUND_HALF_UP', 'FBR section 236Y advance income tax on foreign card spend for Active Taxpayers (ATL)'),
        ('FBR S.236Y Advance Tax (Non-Filer - 10%)', 'ADVANCE_TAX', 'PERCENTAGE', Decimal('10.00'), 'ROUND_HALF_UP', 'Tenth Schedule to Income Tax Ordinance 2001: 100% higher rate for non-filers'),
        ('PRA Punjab Sales Tax on IT / Cloud Services (16%)', 'SALES_TAX_WITHHELD', 'PERCENTAGE', Decimal('16.00'), 'ROUND_HALF_UP', 'Punjab Sales Tax on Services Act 2012: 16% on domain renewals, hosting & IT software (GoDaddy, ElevenLabs)'),
        ('SRB Sindh Sales Tax on Digital Services (15%)', 'SALES_TAX_WITHHELD', 'PERCENTAGE', Decimal('15.00'), 'ROUND_HALF_UP', 'Sindh Sales Tax on Services Act 2011: 15% standard provincial sales tax on digital services'),
        ('Provincial Sales Tax Withholding (5%)', 'SALES_TAX_WITHHELD', 'PERCENTAGE', Decimal('5.00'), 'ROUND_HALF_UP', 'Standard 5% provincial sales tax withholding by corporate agents'),
        ('Combined FBR 236Y Filer (5%) + Provincial ST (5%)', 'COMBINED_TAX', 'PERCENTAGE', Decimal('10.00'), 'ROUND_HALF_UP', 'Combined 5% advance income tax + 5% sales tax withholding'),
        ('Legacy Sheet Formula (~0.48% Adv Tax)', 'LEGACY_FORMULA', 'PERCENTAGE', Decimal('0.48'), 'ROUND_HALF_UP', 'Historical Excel Sheet row 6 formula: =ROUND(PKR * 99.52% * 0.48%)'),
        ('Federal Excise Duty (FED)', 'FED', 'FIXED', Decimal('40.00'), 'EXACT', 'Federal Excise Act 2005: fixed statutory excise charge on bank card statements'),
        ('SMS & Card Banking Fee', 'BANK_CHARGES', 'FIXED', Decimal('250.00'), 'EXACT', 'Bank periodic SMS notification and service charge')
    ]
    for r_name, t_type, c_type, rate, round_m, desc in tax_rules_data:
        tr = TaxRule.query.filter_by(rule_name=r_name).first()
        if not tr:
            tr = TaxRule(rule_name=r_name, tax_type=t_type, calc_type=c_type, default_rate=rate, rounding_method=round_m, description=desc)
            db.session.add(tr)
    db.session.commit()

    print("Database system master data initialized (Users, Cards, Categories, Tax Rules).")

def seed_sample_statement():
    """Seeds the historical sample statement for testing purposes if requested."""
    card = CreditCard.query.filter_by(bank_name='UBL').first()
    admin_user = User.query.filter_by(username='superadmin').first()
    cat_map = {c.code: c for c in AllocationCategory.query.all()}

    existing_stmt = Statement.query.filter_by(statement_number='UBL-CC-2026-09').first()
    if not existing_stmt and card:
        stmt = Statement(
            card_id=card.id,
            statement_number='UBL-CC-2026-09',
            statement_date=date(2026, 9, 20),
            payment_due_date=date(2026, 10, 11),
            period_start_date=date(2026, 8, 21),
            period_end_date=date(2026, 9, 20),
            opening_balance=Decimal('0.00'),
            total_statement_amount=Decimal('484047.70'),
            amount_paid=Decimal('428273.70'),
            outstanding_balance=Decimal('55774.00'),
            status='Partially Paid',
            notes='Sample statement cycle ending 20-Sep-2026.',
            created_by_id=admin_user.id if admin_user else None
        )
        db.session.add(stmt)
        db.session.flush()

        # Transactions
        transactions_data = [
            (date(2026, 9, 1), 'Mid-Journey', 'Midjourney AI Image generation subscription', 'RED', Decimal('10.00'), Decimal('292.4430'), Decimal('2924.43'), Decimal('14.00'), Decimal('14.00'), Decimal('0.00'), Decimal('2952.43')),
            (date(2026, 9, 3), 'Shutterstock', 'Image Monthly Subscription 750 Downloads', 'RED', Decimal('199.00'), Decimal('281.0700'), Decimal('58248.20'), Decimal('279.00'), Decimal('0.00'), Decimal('0.00'), Decimal('58527.20')),
            (date(2026, 9, 5), 'Google Workspace', 'GOOGLE GSUITE RED.COM.PK CHARGE TO RED', 'RED', Decimal('700.00'), Decimal('293.6450'), Decimal('204820.00'), Decimal('1025.00'), Decimal('0.00'), Decimal('0.00'), Decimal('205845.00')),
            (date(2026, 9, 5), 'Google Workspace', 'GOOGLE GSUITE PFDC.ORG (CHARGE TO CLIENT)', 'PFDC', Decimal('50.40'), Decimal('293.6450'), Decimal('14744.41'), Decimal('71.00'), Decimal('1418.15'), Decimal('0.00'), Decimal('16233.56')),
            (date(2026, 9, 7), 'MGF MAGNIFIC PREMIUM', 'MGF Magnific Premium Malaga ES License 1', 'RED', None, None, Decimal('10350.00'), Decimal('0.00'), Decimal('0.00'), Decimal('0.00'), Decimal('10350.00')),
            (date(2026, 9, 7), 'MGF MAGNIFIC PREMIUM', 'MGF Magnific Premium Malaga ES License 2', 'RED', None, None, Decimal('10350.00'), Decimal('0.00'), Decimal('0.00'), Decimal('0.00'), Decimal('10350.00')),
            (date(2026, 9, 8), 'MGF MAGNIFIC PREMIUM', 'MGF Magnific Premium Malaga ES Annual Team Pack', 'RED', None, None, Decimal('93150.00'), Decimal('0.00'), Decimal('0.00'), Decimal('0.00'), Decimal('93150.00')),
            (date(2026, 9, 9), 'Anthropic Claude', 'ANTHROPIC CLAUDE SUB ANTHROPIC.COM US (Seat 1)', 'RED', None, None, Decimal('5847.82'), Decimal('28.00'), Decimal('0.00'), Decimal('0.00'), Decimal('5875.82')),
            (date(2026, 9, 9), 'Anthropic Claude', 'ANTHROPIC CLAUDE SUB ANTHROPIC.COM US (Seat 2)', 'RED', None, None, Decimal('5852.00'), Decimal('0.00'), Decimal('0.00'), Decimal('0.00'), Decimal('5852.00')),
            (date(2026, 9, 10), 'OpenAI ChatGPT', 'OPENAI CHATGPT SUBSCR OPENAI.COM US Team Tier', 'RED', None, None, Decimal('27999.00'), Decimal('0.00'), Decimal('0.00'), Decimal('0.00'), Decimal('27999.00')),
            (date(2026, 9, 11), 'Grok / xAI', 'GROK XAI WWW.GROK.COM US Research Account', 'RED', None, None, Decimal('8773.30'), Decimal('42.00'), Decimal('42.00'), Decimal('0.00'), Decimal('8857.30')),
            (date(2026, 9, 12), 'Shopify', 'SHOPIFY* 552473168 SG (CHARGE TO KKOP)', 'KKOP', None, None, Decimal('7315.00'), Decimal('37.00'), Decimal('0.00'), Decimal('0.00'), Decimal('7352.00')),
            (date(2026, 9, 14), 'ElevenLabs', 'ELEVENLABS Voice Synthesis Studio Plan', 'RED', None, None, Decimal('1729.40'), Decimal('276.70'), Decimal('0.00'), Decimal('0.00'), Decimal('2006.10')),
            (date(2026, 9, 15), 'GoDaddy', 'GoDaddy renewal kallarkaharpress.com hosting & domains', 'KKOP', None, None, Decimal('108320.00'), Decimal('17331.20'), Decimal('0.00'), Decimal('0.00'), Decimal('125651.20')),
            (date(2026, 9, 16), 'Microsoft Teams', 'Microsoft Teams for Ms. Sabene', 'RED', Decimal('18.00'), Decimal('307.1200'), Decimal('5528.16'), Decimal('26.00'), Decimal('0.00'), Decimal('0.00'), Decimal('5554.16')),
            (date(2026, 9, 17), 'Contabo Cloud VPS', 'WWW.CONTABO.COM MUNCHEN DE Infrastructure', 'RED', Decimal('49.30'), Decimal('306.7570'), Decimal('15123.13'), Decimal('76.00'), Decimal('0.00'), Decimal('0.00'), Decimal('15199.13')),
            (date(2026, 9, 18), 'UBL Banking SMS', 'SMS FEE BILLING', 'RED', None, None, Decimal('250.00'), Decimal('0.00'), Decimal('0.00'), Decimal('0.00'), Decimal('250.00')),
            (date(2026, 9, 18), 'Federal Excise Duty', 'FEDERAL EXCISE DUTY STATUTORY', 'RED', None, None, Decimal('40.00'), Decimal('0.00'), Decimal('0.00'), Decimal('0.00'), Decimal('40.00')),
            (date(2026, 9, 19), 'Netflix Singapore', 'NETFLIX.COM SINGAPORE SG (Assigned to Director)', 'SYED_HAMMAD', None, None, Decimal('1155.00'), Decimal('0.00'), Decimal('0.00'), Decimal('0.00'), Decimal('1155.00')),
            (date(2026, 9, 20), 'Google Drive Storage', 'Google Drive (Data Upload for Client)', 'RED', None, None, Decimal('2800.00'), Decimal('0.00'), Decimal('104.95'), Decimal('0.00'), Decimal('2904.95')),
            (date(2026, 9, 20), 'Google Drive Storage', 'Google Drive (Data Upload for Client 2TB)', 'RED', None, None, Decimal('6499.00'), Decimal('0.00'), Decimal('0.00'), Decimal('0.00'), Decimal('6499.00'))
        ]

        for dt, merch, desc, cat_code, usd, rate, pkr, adv, st, oth, tot in transactions_data:
            cat = cat_map.get(cat_code)
            t = Transaction(
                statement_id=stmt.id,
                transaction_date=dt,
                merchant_name=merch,
                description=desc,
                allocation_id=cat.id if cat else None,
                usd_amount=usd,
                exchange_rate=rate,
                pkr_amount=pkr,
                advance_tax=adv,
                sales_tax_withheld=st,
                other_taxes=oth,
                total_amount=tot,
                approval_status='Approved',
                created_by_id=admin_user.id if admin_user else None
            )
            db.session.add(t)

        pmt = Payment(
            statement_id=stmt.id,
            payment_date=date(2026, 10, 5),
            payment_reference='UBL-FT-994827104',
            payment_method='Online Transfer',
            amount=Decimal('428273.70'),
            notes='Sample partial settlement',
            recorded_by_id=admin_user.id if admin_user else None
        )
        db.session.add(pmt)

        recon = ReconciliationRecord(
            statement_id=stmt.id,
            status='Matched',
            bank_total=Decimal('484047.70'),
            system_total=Decimal('484047.70'),
            difference=Decimal('0.00'),
            matched_count=len(transactions_data),
            missing_count=0,
            discrepancy_count=0,
            notes='Sample reconciliation passed.',
            reconciled_by_id=admin_user.id if admin_user else None,
            reconciled_at=datetime.utcnow()
        )
        db.session.add(recon)
        db.session.commit()

