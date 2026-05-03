import streamlit as st
import pandas as pd
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import io
from datetime import datetime
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ==========================================
# 1. KONFIGURASI HALAMAN & CSS
# ==========================================
st.set_page_config(
    page_title="Filter Sakti",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }

    /* === BACKGROUND & APP === */
    .stApp {
        background-color: #0F1117;
        color: #E2E8F0;
    }

    /* === SIDEBAR === */
    [data-testid="stSidebar"] {
        background-color: #141922;
        border-right: 1px solid #1E2A3A;
    }

    [data-testid="stSidebar"] .stRadio label,
    [data-testid="stSidebar"] .stMultiSelect label,
    [data-testid="stSidebar"] .stFileUploader label {
        color: #94A3B8 !important;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 600;
    }

    /* === BRAND TITLE === */
    .brand-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 4px 0 20px 0;
        border-bottom: 1px solid #1E2A3A;
        margin-bottom: 20px;
    }
    .brand-dot {
        width: 10px;
        height: 10px;
        border-radius: 3px;
        background: linear-gradient(135deg, #4F8EF7, #2563EB);
        flex-shrink: 0;
    }
    .brand-name {
        font-size: 17px;
        font-weight: 700;
        color: #F1F5F9;
        letter-spacing: -0.3px;
    }
    .brand-sub {
        font-size: 11px;
        color: #64748B;
        font-weight: 400;
        letter-spacing: 0.02em;
        margin-top: 1px;
    }

    /* === METRIC CARDS === */
    .metric-row {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
    }
    .metric-card {
        flex: 1;
        background-color: #141922;
        padding: 18px 20px;
        border-radius: 10px;
        border: 1px solid #1E2A3A;
        border-left: 3px solid #2563EB;
    }
    .metric-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #64748B;
        font-weight: 600;
        margin-bottom: 6px;
    }
    .metric-value {
        font-size: 28px;
        font-weight: 700;
        color: #F1F5F9;
        line-height: 1;
    }
    .metric-sub {
        font-size: 12px;
        color: #475569;
        margin-top: 4px;
    }

    /* === STATUS BADGE === */
    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 7px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 20px;
    }
    .status-online {
        background-color: #0D2418;
        color: #34D399;
        border: 1px solid #064E30;
    }
    .status-offline {
        background-color: #2D0D0D;
        color: #F87171;
        border: 1px solid #4D1919;
    }
    .status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background-color: currentColor;
    }

    /* === PAGE TITLE === */
    .page-title {
        font-size: 22px;
        font-weight: 700;
        color: #F1F5F9;
        letter-spacing: -0.4px;
        margin-bottom: 4px;
    }
    .page-subtitle {
        font-size: 13px;
        color: #64748B;
        margin-bottom: 24px;
    }

    /* === SECTION HEADER === */
    .section-header {
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: #475569;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #1E2A3A;
    }

    /* === DOWNLOAD BUTTON === */
    .stDownloadButton button {
        background: linear-gradient(135deg, #2563EB, #1D4ED8) !important;
        color: #FFFFFF !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 10px 20px !important;
        width: 100% !important;
        transition: all 0.2s !important;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25) !important;
    }
    .stDownloadButton button:hover {
        background: linear-gradient(135deg, #1D4ED8, #1E40AF) !important;
        box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35) !important;
    }

    /* === FILE UPLOADER === */
    [data-testid="stFileUploaderDropzone"] {
        background-color: #141922 !important;
        border: 1.5px dashed #2D3F55 !important;
        border-radius: 10px !important;
    }
    [data-testid="stFileUploaderDropzone"]:hover {
        border-color: #2563EB !important;
    }

    /* === DATAFRAME === */
    .stDataFrame {
        border: 1px solid #1E2A3A !important;
        border-radius: 10px !important;
        overflow: hidden;
    }

    /* === RADIO BUTTONS === */
    .stRadio [data-baseweb="radio"] {
        gap: 8px;
    }
    .stRadio label span {
        color: #CBD5E1 !important;
        font-size: 14px !important;
    }

    /* === MULTISELECT === */
    .stMultiSelect [data-baseweb="tag"] {
        background-color: #1E3A5F !important;
        color: #93C5FD !important;
        border: 1px solid #2563EB !important;
        border-radius: 5px !important;
    }

    /* Hide streamlit elements */
    #MainMenu { visibility: hidden; }
    footer { visibility: hidden; }
    header { visibility: hidden; }

    /* === SPINNER === */
    .stSpinner > div {
        border-top-color: #2563EB !important;
    }

    /* Warning / info */
    .stWarning {
        background-color: #1C1A0D !important;
        border-color: #854D0E !important;
        color: #FDE68A !important;
    }
    </style>
    """, unsafe_allow_html=True)

# ==========================================
# 2. KONEKSI GOOGLE SHEETS
# ==========================================
@st.cache_resource
def get_gspread_client():
    try:
        try:
            info = dict(st.secrets["gcp_service_account"])
        except Exception:
            if "GCP_PRIVATE_KEY" in os.environ:
                info = {
                    "type": os.environ.get("GCP_TYPE", "service_account"),
                    "project_id": os.environ.get("GCP_PROJECT_ID"),
                    "private_key_id": os.environ.get("GCP_PRIVATE_KEY_ID"),
                    "private_key": os.environ.get("GCP_PRIVATE_KEY", "").replace('\\n', '\n'),
                    "client_email": os.environ.get("GCP_CLIENT_EMAIL"),
                    "client_id": os.environ.get("GCP_CLIENT_ID"),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{os.environ.get('GCP_CLIENT_EMAIL', '')}"
                }
            else:
                return None

        if 'private_key' in info:
            info['private_key'] = info['private_key'].replace('\\n', '\n')
            
        creds = ServiceAccountCredentials.from_json_keyfile_dict(
            info,
            ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        )
        return gspread.authorize(creds)
    except Exception as e:
        return None

# ==========================================
# 3. FUNGSI LOGIKA (MODULAR)
# ==========================================

def clean_common_data(df):
    if 'Workorder' in df.columns:
        df['Workorder'] = df['Workorder'].astype(str).str.replace(r'\.0$', '', regex=True).str.strip()
    if 'Booking Date' in df.columns:
        df['Booking Date'] = df['Booking Date'].astype(str).str.split('.').str[0]
    return df

def proses_wsa(df):
    col_sc = 'SC Order No/Track ID/CSRM No'
    df = df[df[col_sc].astype(str).str.contains('AO|PDA|WSA', na=False)]
    if 'CRM Order Type' in df.columns:
        df = df[df['CRM Order Type'].isin(['CREATE', 'MIGRATE'])]
    if 'Contact Number' in df.columns and 'Customer Name' in df.columns:
        c_map = df.loc[df['Contact Number'].notna() & (df['Contact Number'] != ''), ['Customer Name', 'Contact Number']].drop_duplicates('Customer Name')
        c_dict = dict(zip(c_map['Customer Name'], c_map['Contact Number']))
        def fill_contact(row):
            val = str(row['Contact Number'])
            if pd.isna(row['Contact Number']) or val.strip() == '' or val.lower() == 'nan':
                return c_dict.get(row['Customer Name'], row['Contact Number'])
            return row['Contact Number']
        df['Contact Number'] = df.apply(fill_contact, axis=1)
    return df, col_sc

def proses_modoroso(df):
    col_sc = 'SC Order No/Track ID/CSRM No'
    df = df[df[col_sc].astype(str).str.contains(r'-MO|-DO', na=False, case=False)].copy()
    if 'CRM Order Type' in df.columns:
        def detect_mo_do(val):
            s = str(val).upper()
            if '-MO' in s: return 'MO'
            if '-DO' in s: return 'DO'
            return 'MO'
        df['CRM Order Type'] = df[col_sc].apply(detect_mo_do)
    df['Mitra'] = 'TSEL'
    return df, 'Workorder'

def proses_wappr(df):
    col_sc = 'SC Order No/Track ID/CSRM No'
    df = df[df[col_sc].astype(str).str.contains('AO|PDA', na=False)]
    if 'Status' in df.columns:
        df = df[df['Status'].astype(str).str.strip().str.upper() == 'WAPPR']
    return df, 'Workorder'

# ==========================================
# 4. SIDEBAR
# ==========================================
with st.sidebar:
    st.markdown("""
        <div class="brand-header">
            <div class="brand-dot"></div>
            <div>
                <div class="brand-name">Filter Sakti</div>
                <div class="brand-sub">Data Cleansing Tool</div>
            </div>
        </div>
    """, unsafe_allow_html=True)

    st.markdown('<a href="/" target="_self" style="display: block; background: #1E2A3A; color: white; padding: 10px; text-align: center; border-radius: 8px; text-decoration: none; margin-bottom: 20px; font-weight: 600; font-size: 14px; border: 1px solid #2D3F55; transition: 0.2s;">🏠 Kembali ke Menu Utama</a>', unsafe_allow_html=True)

    st.markdown('<div class="section-header">OPERASI</div>', unsafe_allow_html=True)
    menu = st.radio(
        label="Pilih mode:",
        options=["WSA (Validation)", "MODOROSO", "WAPPR"],
        label_visibility="collapsed"
    )

    st.markdown('<div style="height:16px"></div>', unsafe_allow_html=True)
    st.markdown('<div class="section-header">FILTER BULAN</div>', unsafe_allow_html=True)

    curr_month = datetime.now().month
    prev_month = curr_month - 1 if curr_month > 1 else 12
    bulan_labels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

    selected_months = st.multiselect(
        label="Filter bulan:",
        options=list(range(1, 13)),
        default=[prev_month, curr_month],
        format_func=lambda x: bulan_labels[x - 1],
        label_visibility="collapsed"
    )

    st.markdown('<div style="height:16px"></div>', unsafe_allow_html=True)
    st.markdown('<div class="section-header">DATA FILE</div>', unsafe_allow_html=True)

    uploaded_file = st.file_uploader(
        label="Upload Data",
        type=["xlsx", "xls", "csv"],
        label_visibility="collapsed"
    )

    st.markdown('<div style="flex:1"></div>', unsafe_allow_html=True)
    st.markdown("""
        <div style="padding-top:24px; border-top: 1px solid #1E2A3A; color:#334155; font-size:11px;">
            Filter Sakti · v2.1<br>Telkom Cleansing Tool
        </div>
    """, unsafe_allow_html=True)

# ==========================================
# 5. MAIN CONTENT
# ==========================================
mode_labels = {
    "WSA (Validation)": "WSA",
    "MODOROSO": "MODOROSO",
    "WAPPR": "WAPPR"
}
mode_desc = {
    "WSA (Validation)": "Validasi & filter AO/PDA/WSA — tipe CREATE & MIGRATE",
    "MODOROSO": "Proses order MO/DO dengan deteksi tipe otomatis",
    "WAPPR": "Filter status WAPPR untuk AO & PDA"
}

st.markdown(f'<div class="page-title">Dashboard {mode_labels[menu]}</div>', unsafe_allow_html=True)
st.markdown(f'<div class="page-subtitle">{mode_desc[menu]}</div>', unsafe_allow_html=True)

# --- Koneksi Google Sheets ---
client = get_gspread_client()
ws = None
connection_status = False

if client:
    try:
        sh = client.open("Salinan dari NEW GDOC WSA FULFILLMENT")
        if menu == "MODOROSO":
            target_sheet_name = "MODOROSO_JAKTIMSEL"
            try:
                ws = sh.worksheet(target_sheet_name)
            except Exception:
                st.error(f"Sheet '{target_sheet_name}' tidak ditemukan. Cek nama tab di GDoc.")
                ws = None
        else:
            ws = sh.get_worksheet(0)
            target_sheet_name = ws.title if ws else "-"

        if ws:
            st.markdown(f"""
                <div class="status-badge status-online">
                    <div class="status-dot"></div>
                    Terhubung ke Google Sheets &nbsp;·&nbsp; <strong>{target_sheet_name}</strong>
                </div>
            """, unsafe_allow_html=True)
            connection_status = True
        else:
            st.markdown('<div class="status-badge status-offline"><div class="status-dot"></div>Sheet tidak ditemukan</div>', unsafe_allow_html=True)

    except Exception as e:
        st.markdown(f'<div class="status-badge status-offline"><div class="status-dot"></div>Gagal akses Google Sheets · {e}</div>', unsafe_allow_html=True)
else:
    st.markdown('<div class="status-badge status-offline"><div class="status-dot"></div>Secrets API tidak terbaca</div>', unsafe_allow_html=True)

# --- Proses Data ---
if connection_status and ws and uploaded_file:
    df_raw = (
        pd.read_csv(uploaded_file)
        if uploaded_file.name.lower().endswith('.csv')
        else pd.read_excel(uploaded_file)
    )

    try:
        with st.spinner("Memproses data..."):
            df = clean_common_data(df_raw.copy())

            if menu == "WSA (Validation)":
                df_filtered, check_col = proses_wsa(df)
            elif menu == "MODOROSO":
                df_filtered, check_col = proses_modoroso(df)
            elif menu == "WAPPR":
                df_filtered, check_col = proses_wappr(df)

            # Filter bulan
            if 'Date Created' in df_filtered.columns:
                df_filtered['Date Created DT'] = pd.to_datetime(
                    df_filtered['Date Created'].astype(str).str.replace(r'\.0$', '', regex=True),
                    errors='coerce'
                )
                data_count_before = len(df_filtered)
                if selected_months:
                    df_filtered = df_filtered[df_filtered['Date Created DT'].dt.month.isin(selected_months)]

                if data_count_before > 0 and len(df_filtered) == 0:
                    st.warning(f"⚠️ {data_count_before} data ditemukan, tetapi tidak ada yang lolos filter bulan.")

                df_filtered['Date Created Display'] = df_filtered['Date Created DT'].dt.strftime('%d/%m/%Y %H:%M')
                df_filtered['Date Created'] = df_filtered['Date Created Display']

            # Deduplikasi dengan Google Sheets
            google_data = ws.get_all_records()
            google_df = pd.DataFrame(google_data)

            col_sc = 'SC Order No/Track ID/CSRM No'

            if not google_df.empty and check_col in google_df.columns:
                existing_ids = google_df[check_col].astype(str).str.replace(r'\.0$', '', regex=True).str.strip().unique()
                if col_sc in df_filtered.columns:
                    df_filtered[col_sc] = df_filtered[col_sc].astype(str).apply(lambda x: x.split('_')[0])
                df_final = df_filtered[~df_filtered[check_col].astype(str).str.strip().isin(existing_ids)].copy()
            else:
                if col_sc in df_filtered.columns:
                    df_filtered[col_sc] = df_filtered[col_sc].astype(str).apply(lambda x: x.split('_')[0])
                df_final = df_filtered.copy()

            # Kolom output
            if menu == "MODOROSO":
                target_order = ['Date Created', 'Workorder', 'SC Order No/Track ID/CSRM No',
                                'Service No.', 'CRM Order Type', 'Status', 'Address',
                                'Customer Name', 'Workzone', 'Contact Number', 'Mitra']
            else:
                target_order = ['Date Created', 'Workorder', 'SC Order No/Track ID/CSRM No',
                                'Service No.', 'CRM Order Type', 'Status', 'Address',
                                'Customer Name', 'Workzone', 'Booking Date', 'Contact Number']

            cols_final = [c for c in target_order if c in df_final.columns]

            # Sorting
            if menu == "MODOROSO":
                if 'Status' in df_final.columns:
                    df_final['_is_compwork'] = df_final['Status'].astype(str).str.strip().str.upper() == 'COMPWORK'
                    sort_cols = ['_is_compwork', 'Workzone'] if 'Workzone' in df_final.columns else ['_is_compwork']
                    df_final = df_final.sort_values(sort_cols, ascending=[False, True] if len(sort_cols) == 2 else [False])
                    df_final = df_final.drop(columns=['_is_compwork'])
                elif 'Workzone' in df_final.columns:
                    df_final = df_final.sort_values('Workzone')
            else:
                if 'Workzone' in df_final.columns:
                    df_final = df_final.sort_values('Workzone')

        # === METRICS ===
        duplicates_removed = len(df_filtered) - len(df_final)
        st.markdown(f"""
            <div class="metric-row">
                <div class="metric-card">
                    <div class="metric-label">Data Terfilter</div>
                    <div class="metric-value">{len(df_filtered):,}</div>
                    <div class="metric-sub">Dari total {len(df_raw):,} baris</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Data Unik</div>
                    <div class="metric-value">{len(df_final):,}</div>
                    <div class="metric-sub">{duplicates_removed:,} duplikat dihapus</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Validasi By</div>
                    <div class="metric-value" style="font-size:16px;padding-top:6px">{check_col}</div>
                    <div class="metric-sub">Kolom referensi</div>
                </div>
            </div>
        """, unsafe_allow_html=True)

        # === TABLE ===
        st.markdown('<div class="section-header">PREVIEW DATA UNIK</div>', unsafe_allow_html=True)
        st.dataframe(df_final[cols_final], use_container_width=True, hide_index=True)

        st.markdown('<div style="height:12px"></div>', unsafe_allow_html=True)

        # === DOWNLOAD ===
        excel_buffer = io.BytesIO()
        with pd.ExcelWriter(excel_buffer, engine='xlsxwriter') as writer:
            df_final[cols_final].to_excel(writer, index=False)

        tanggal = datetime.now().strftime('%d%m%Y')
        st.download_button(
            label=f"⬇  Download Hasil {mode_labels[menu]}  ·  {len(df_final):,} baris  ·  Excel",
            data=excel_buffer.getvalue(),
            file_name=f"FilterSakti_{mode_labels[menu]}_{tanggal}.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True
        )

    except Exception as e:
        st.error(f"Terjadi kesalahan saat memproses: {e}")

elif connection_status and ws and not uploaded_file:
    # Empty state
    st.markdown("""
        <div style="
            margin-top: 48px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
            color: #475569;
        ">
            <div style="
                width: 56px; height: 56px;
                background: #141922;
                border: 1px solid #1E2A3A;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 22px;
            ">📂</div>
            <div style="font-size:16px; font-weight:600; color:#64748B;">Upload file untuk mulai</div>
            <div style="font-size:13px; color:#334155; text-align:center; max-width:320px; line-height:1.6;">
                Upload file <strong style="color:#475569">.xlsx</strong>, <strong style="color:#475569">.xls</strong>, atau <strong style="color:#475569">.csv</strong> di sidebar kiri. Data akan diproses dan dibandingkan otomatis dengan Google Sheets.
            </div>
        </div>
    """, unsafe_allow_html=True)
