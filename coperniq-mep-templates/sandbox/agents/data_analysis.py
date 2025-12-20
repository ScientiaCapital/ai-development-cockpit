"""
Data Analysis & OCR Module for E2B Sandbox

Provides capabilities for:
- OCR: Extract text from utility bills, documents, PDFs
- Data Analysis: CSV/spreadsheet processing, calculations
- Visualization: Charts, graphs for profitability, performance
- Document Processing: PDF, Excel, Word file handling

Use Cases for MEP Contractors:
1. "Analyze this utility bill PDF" → OCR + solar/battery sizing
2. "Show me production vs design" → Data analysis + charts
3. "Calculate job profitability" → Financial analysis
4. "What's my margin by trade?" → Multi-dimensional analysis
"""

import os
import io
import base64
import json
from typing import Dict, List, Any, Optional, Union, Tuple
from dataclasses import dataclass, field
from pathlib import Path
from datetime import datetime
import tempfile

# Image and OCR processing
try:
    from PIL import Image
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    print("Warning: pytesseract or PIL not installed. OCR disabled.")

# PDF processing
try:
    from pdf2image import convert_from_path, convert_from_bytes
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False
    print("Warning: pdf2image not installed. PDF OCR disabled.")

try:
    import PyPDF2
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False

# Data analysis
try:
    import pandas as pd
    import numpy as np
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    print("Warning: pandas/numpy not installed. Data analysis limited.")

# OpenCV for image preprocessing
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


# =============================================================================
# OCR PROCESSING
# =============================================================================

@dataclass
class OCRResult:
    """Result from OCR processing"""
    text: str
    confidence: float
    source_type: str  # 'image', 'pdf', 'scan'
    pages: int = 1
    extracted_data: Dict = field(default_factory=dict)
    raw_data: Optional[Any] = None  # pandas DataFrame if available


class OCRProcessor:
    """
    OCR Processor for utility bills, documents, and images

    Optimized for MEP contractor documents:
    - Utility bills (electric, gas, water)
    - Invoices and receipts
    - Equipment specifications
    - Inspection reports
    """

    def __init__(self, tesseract_cmd: Optional[str] = None):
        """
        Initialize OCR processor

        Args:
            tesseract_cmd: Path to tesseract executable (optional)
        """
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

        self.available = TESSERACT_AVAILABLE

    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Preprocess image for better OCR accuracy

        Applies:
        - Grayscale conversion
        - Contrast enhancement
        - Noise reduction
        - Thresholding
        """
        if not CV2_AVAILABLE:
            # Basic preprocessing with PIL only
            return image.convert('L')

        # Convert PIL to OpenCV format
        img_array = np.array(image)

        # Convert to grayscale
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array

        # Apply thresholding
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

        # Noise removal
        denoised = cv2.medianBlur(thresh, 3)

        # Convert back to PIL
        return Image.fromarray(denoised)

    def extract_text_from_image(
        self,
        image: Union[str, Path, Image.Image, bytes],
        lang: str = 'eng',
        config: str = '--psm 6',
        preprocess: bool = True
    ) -> OCRResult:
        """
        Extract text from an image

        Args:
            image: Image path, PIL Image, or bytes
            lang: Tesseract language code
            config: Tesseract configuration
            preprocess: Whether to preprocess image

        Returns:
            OCRResult with extracted text
        """
        if not self.available:
            return OCRResult(
                text="OCR not available. Install pytesseract and tesseract.",
                confidence=0.0,
                source_type="error"
            )

        # Load image
        if isinstance(image, (str, Path)):
            img = Image.open(image)
        elif isinstance(image, bytes):
            img = Image.open(io.BytesIO(image))
        else:
            img = image

        # Preprocess
        if preprocess:
            img = self.preprocess_image(img)

        # Extract text
        text = pytesseract.image_to_string(img, lang=lang, config=config)

        # Get detailed data with confidence
        if PANDAS_AVAILABLE:
            data = pytesseract.image_to_data(
                img,
                lang=lang,
                config=config,
                output_type=pytesseract.Output.DATAFRAME
            )
            # Calculate average confidence
            valid_conf = data[data['conf'] > 0]['conf']
            avg_confidence = valid_conf.mean() if len(valid_conf) > 0 else 0.0
            raw_data = data
        else:
            avg_confidence = 50.0  # Default confidence
            raw_data = None

        return OCRResult(
            text=text.strip(),
            confidence=avg_confidence,
            source_type='image',
            raw_data=raw_data
        )

    def extract_text_from_pdf(
        self,
        pdf_path: Union[str, Path, bytes],
        lang: str = 'eng',
        dpi: int = 300
    ) -> OCRResult:
        """
        Extract text from a PDF using OCR

        Args:
            pdf_path: Path to PDF or PDF bytes
            lang: Tesseract language code
            dpi: Resolution for PDF to image conversion

        Returns:
            OCRResult with extracted text from all pages
        """
        if not PDF2IMAGE_AVAILABLE:
            # Try text extraction without OCR
            if PYPDF2_AVAILABLE:
                return self._extract_pdf_text_native(pdf_path)
            return OCRResult(
                text="PDF OCR not available. Install pdf2image and poppler.",
                confidence=0.0,
                source_type="error"
            )

        # Convert PDF to images
        if isinstance(pdf_path, bytes):
            images = convert_from_bytes(pdf_path, dpi=dpi)
        else:
            images = convert_from_path(pdf_path, dpi=dpi)

        # Extract text from each page
        all_text = []
        total_confidence = 0.0

        for i, img in enumerate(images):
            result = self.extract_text_from_image(img, lang=lang)
            all_text.append(f"--- Page {i + 1} ---\n{result.text}")
            total_confidence += result.confidence

        combined_text = "\n\n".join(all_text)
        avg_confidence = total_confidence / len(images) if images else 0.0

        return OCRResult(
            text=combined_text,
            confidence=avg_confidence,
            source_type='pdf',
            pages=len(images)
        )

    def _extract_pdf_text_native(self, pdf_path: Union[str, Path, bytes]) -> OCRResult:
        """Extract text from PDF without OCR (for text-based PDFs)"""
        try:
            if isinstance(pdf_path, bytes):
                reader = PyPDF2.PdfReader(io.BytesIO(pdf_path))
            else:
                reader = PyPDF2.PdfReader(pdf_path)

            text_pages = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                if text.strip():
                    text_pages.append(f"--- Page {i + 1} ---\n{text}")

            return OCRResult(
                text="\n\n".join(text_pages),
                confidence=95.0,  # Native text extraction is high confidence
                source_type='pdf_native',
                pages=len(reader.pages)
            )
        except Exception as e:
            return OCRResult(
                text=f"Error extracting PDF text: {str(e)}",
                confidence=0.0,
                source_type='error'
            )


# =============================================================================
# UTILITY BILL PARSER
# =============================================================================

@dataclass
class UtilityBillData:
    """Parsed utility bill data"""
    provider: Optional[str] = None
    account_number: Optional[str] = None
    billing_period: Optional[str] = None
    total_amount: Optional[float] = None
    kwh_usage: Optional[float] = None
    rate_per_kwh: Optional[float] = None
    peak_demand_kw: Optional[float] = None
    service_address: Optional[str] = None
    raw_text: str = ""
    confidence: float = 0.0


class UtilityBillParser:
    """
    Parser for utility bills (electric, gas, water)

    Extracts key data for solar/battery sizing:
    - kWh usage (monthly, annual)
    - Peak demand (kW)
    - Rate structure
    - Billing period
    """

    def __init__(self):
        self.ocr = OCRProcessor()

        # Common patterns for utility bill data
        self.patterns = {
            'kwh': [
                r'(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:kWh|KWH|kwh)',
                r'usage[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)',
                r'consumption[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)',
            ],
            'amount': [
                r'\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',
                r'total[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',
                r'amount\s*due[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            ],
            'demand': [
                r'(\d{1,3}(?:\.\d+)?)\s*(?:kW|KW|kw)',
                r'peak\s*demand[:\s]*(\d{1,3}(?:\.\d+)?)',
                r'demand[:\s]*(\d{1,3}(?:\.\d+)?)',
            ],
            'account': [
                r'account\s*(?:#|no\.?|number)?[:\s]*(\d{5,20})',
                r'acct[:\s]*(\d{5,20})',
            ],
        }

    def parse_utility_bill(
        self,
        file_path: Union[str, Path, bytes],
        file_type: str = 'auto'
    ) -> UtilityBillData:
        """
        Parse a utility bill and extract key data

        Args:
            file_path: Path to file or file bytes
            file_type: 'pdf', 'image', or 'auto' to detect

        Returns:
            UtilityBillData with extracted information
        """
        import re

        # Detect file type
        if file_type == 'auto':
            if isinstance(file_path, bytes):
                # Check magic bytes
                if file_path[:4] == b'%PDF':
                    file_type = 'pdf'
                else:
                    file_type = 'image'
            else:
                ext = Path(file_path).suffix.lower()
                file_type = 'pdf' if ext == '.pdf' else 'image'

        # Extract text
        if file_type == 'pdf':
            ocr_result = self.ocr.extract_text_from_pdf(file_path)
        else:
            ocr_result = self.ocr.extract_text_from_image(file_path)

        text = ocr_result.text

        # Parse extracted text
        data = UtilityBillData(
            raw_text=text,
            confidence=ocr_result.confidence
        )

        # Extract kWh usage
        for pattern in self.patterns['kwh']:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    data.kwh_usage = float(match.group(1).replace(',', ''))
                    break
                except ValueError:
                    pass

        # Extract total amount
        for pattern in self.patterns['amount']:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    data.total_amount = float(match.group(1).replace(',', ''))
                    break
                except ValueError:
                    pass

        # Extract peak demand
        for pattern in self.patterns['demand']:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    data.peak_demand_kw = float(match.group(1).replace(',', ''))
                    break
                except ValueError:
                    pass

        # Extract account number
        for pattern in self.patterns['account']:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data.account_number = match.group(1)
                break

        # Calculate rate if we have both
        if data.kwh_usage and data.total_amount and data.kwh_usage > 0:
            data.rate_per_kwh = data.total_amount / data.kwh_usage

        return data


# =============================================================================
# DATA ANALYSIS ENGINE
# =============================================================================

class DataAnalysisEngine:
    """
    Data analysis engine for MEP contractor data

    Capabilities:
    - CSV/Excel analysis
    - Profitability calculations
    - Performance metrics
    - Trend analysis
    - Chart generation
    """

    def __init__(self):
        self.available = PANDAS_AVAILABLE

    def load_csv(self, file_path: Union[str, Path, bytes]) -> pd.DataFrame:
        """Load a CSV file into a DataFrame"""
        if not self.available:
            raise RuntimeError("pandas not available")

        if isinstance(file_path, bytes):
            return pd.read_csv(io.BytesIO(file_path))
        return pd.read_csv(file_path)

    def load_excel(self, file_path: Union[str, Path, bytes], sheet_name: str = None) -> pd.DataFrame:
        """Load an Excel file into a DataFrame"""
        if not self.available:
            raise RuntimeError("pandas not available")

        if isinstance(file_path, bytes):
            return pd.read_excel(io.BytesIO(file_path), sheet_name=sheet_name)
        return pd.read_excel(file_path, sheet_name=sheet_name)

    def calculate_profitability(
        self,
        data: pd.DataFrame,
        revenue_col: str,
        cost_col: str,
        group_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculate profitability metrics

        Args:
            data: DataFrame with financial data
            revenue_col: Column name for revenue
            cost_col: Column name for costs
            group_by: Optional column to group by (e.g., 'job_type', 'trade')

        Returns:
            Dictionary with profitability metrics
        """
        result = {
            'total_revenue': data[revenue_col].sum(),
            'total_cost': data[cost_col].sum(),
        }
        result['total_profit'] = result['total_revenue'] - result['total_cost']
        result['overall_margin'] = (
            result['total_profit'] / result['total_revenue']
            if result['total_revenue'] > 0 else 0
        )

        if group_by and group_by in data.columns:
            grouped = data.groupby(group_by).agg({
                revenue_col: 'sum',
                cost_col: 'sum'
            }).reset_index()

            grouped['profit'] = grouped[revenue_col] - grouped[cost_col]
            grouped['margin'] = grouped['profit'] / grouped[revenue_col]

            result['by_group'] = grouped.to_dict('records')

        return result

    def analyze_production(
        self,
        data: pd.DataFrame,
        actual_col: str,
        design_col: str,
        date_col: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze production vs design (for solar systems)

        Args:
            data: DataFrame with production data
            actual_col: Column with actual production
            design_col: Column with design/expected production
            date_col: Optional date column for time series

        Returns:
            Dictionary with production analysis
        """
        result = {
            'total_actual': data[actual_col].sum(),
            'total_design': data[design_col].sum(),
        }

        # Performance ratio
        result['performance_ratio'] = (
            result['total_actual'] / result['total_design']
            if result['total_design'] > 0 else 0
        )

        # Identify underperformers (< 90% of design)
        data['perf_ratio'] = data[actual_col] / data[design_col]
        underperformers = data[data['perf_ratio'] < 0.90]
        result['underperforming_count'] = len(underperformers)
        result['underperforming_systems'] = underperformers.to_dict('records')

        # Time series if date provided
        if date_col and date_col in data.columns:
            data[date_col] = pd.to_datetime(data[date_col])
            monthly = data.groupby(data[date_col].dt.to_period('M')).agg({
                actual_col: 'sum',
                design_col: 'sum'
            })
            monthly['ratio'] = monthly[actual_col] / monthly[design_col]
            result['monthly_trend'] = monthly.to_dict()

        return result

    def generate_chart_data(
        self,
        data: pd.DataFrame,
        x_col: str,
        y_col: str,
        chart_type: str = 'bar',
        group_col: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate chart data for visualization

        Args:
            data: DataFrame with data
            x_col: X-axis column
            y_col: Y-axis column
            chart_type: 'bar', 'line', 'pie', 'scatter'
            group_col: Optional grouping column

        Returns:
            Dictionary with chart configuration and data
        """
        chart_data = {
            'type': chart_type,
            'x_label': x_col,
            'y_label': y_col,
        }

        if group_col and group_col in data.columns:
            # Grouped chart
            grouped = data.groupby([x_col, group_col])[y_col].sum().unstack()
            chart_data['data'] = grouped.to_dict()
            chart_data['categories'] = list(grouped.index)
            chart_data['series'] = list(grouped.columns)
        else:
            # Simple chart
            chart_data['data'] = {
                'x': data[x_col].tolist(),
                'y': data[y_col].tolist()
            }

        return chart_data


# =============================================================================
# SOLAR/BATTERY SIZING CALCULATOR
# =============================================================================

@dataclass
class SizingRecommendation:
    """Solar/battery sizing recommendation"""
    annual_kwh: float
    recommended_system_size_kw: float
    estimated_production_kwh: float
    offset_percentage: float
    battery_recommendation_kwh: Optional[float] = None
    roi_years: Optional[float] = None
    notes: List[str] = field(default_factory=list)


class SolarSizingCalculator:
    """
    Solar and battery sizing calculator

    Uses utility bill data to recommend system size
    """

    # Regional sun hours per day (average)
    SUN_HOURS = {
        'southwest': 6.0,  # AZ, NM, NV
        'southeast': 5.0,  # FL, GA, SC
        'midwest': 4.5,    # IL, IN, OH
        'northeast': 4.0,  # NY, MA, PA
        'northwest': 3.5,  # WA, OR
        'default': 4.5
    }

    def __init__(self, region: str = 'default'):
        self.sun_hours = self.SUN_HOURS.get(region, self.SUN_HOURS['default'])

    def recommend_from_bill(
        self,
        bill_data: UtilityBillData,
        months_covered: int = 1,
        target_offset: float = 1.0,  # 100% offset by default
        include_battery: bool = True
    ) -> SizingRecommendation:
        """
        Generate sizing recommendation from utility bill data

        Args:
            bill_data: Parsed utility bill data
            months_covered: Number of months the bill covers
            target_offset: Target electricity offset (0.0 to 1.0+)
            include_battery: Whether to recommend battery storage

        Returns:
            SizingRecommendation with system sizing
        """
        notes = []

        # Calculate annual usage
        if bill_data.kwh_usage:
            annual_kwh = bill_data.kwh_usage * (12 / months_covered)
        else:
            notes.append("kWh usage not found in bill. Using estimate.")
            annual_kwh = 10000  # Default estimate

        # Calculate required system size
        # Formula: Annual kWh / (Sun Hours × 365 × 0.80 efficiency)
        daily_kwh_needed = (annual_kwh * target_offset) / 365
        system_size_kw = daily_kwh_needed / (self.sun_hours * 0.80)

        # Round to standard sizes
        system_size_kw = round(system_size_kw * 2) / 2  # Round to 0.5 kW

        # Calculate estimated production
        estimated_production = system_size_kw * self.sun_hours * 365 * 0.80
        actual_offset = estimated_production / annual_kwh if annual_kwh > 0 else 0

        # Battery recommendation (cover peak demand + 2 hours backup)
        battery_kwh = None
        if include_battery:
            if bill_data.peak_demand_kw:
                battery_kwh = bill_data.peak_demand_kw * 2  # 2 hours backup
            else:
                battery_kwh = system_size_kw * 0.25  # 25% of system size
            battery_kwh = round(battery_kwh)
            notes.append(f"Battery sized for {battery_kwh} kWh backup")

        # Simple ROI calculation
        if bill_data.total_amount and months_covered > 0:
            annual_savings = (bill_data.total_amount / months_covered) * 12 * actual_offset
            system_cost = system_size_kw * 3000  # $3/watt estimate
            roi_years = system_cost / annual_savings if annual_savings > 0 else None
        else:
            roi_years = None

        return SizingRecommendation(
            annual_kwh=annual_kwh,
            recommended_system_size_kw=system_size_kw,
            estimated_production_kwh=estimated_production,
            offset_percentage=actual_offset * 100,
            battery_recommendation_kwh=battery_kwh,
            roi_years=roi_years,
            notes=notes
        )


# =============================================================================
# E2B SANDBOX INTEGRATION
# =============================================================================

def generate_analysis_code(
    analysis_type: str,
    file_path: str,
    options: Dict[str, Any] = None
) -> str:
    """
    Generate Python code for E2B sandbox execution

    Args:
        analysis_type: Type of analysis ('profitability', 'production', 'chart')
        file_path: Path to data file in sandbox
        options: Analysis-specific options

    Returns:
        Python code string to execute in E2B
    """
    options = options or {}

    if analysis_type == 'profitability':
        return f'''
import pandas as pd
import json

# Load data
df = pd.read_csv("{file_path}")

# Calculate profitability
revenue_col = "{options.get('revenue_col', 'revenue')}"
cost_col = "{options.get('cost_col', 'cost')}"
group_by = "{options.get('group_by', '')}" or None

total_revenue = df[revenue_col].sum()
total_cost = df[cost_col].sum()
total_profit = total_revenue - total_cost
margin = total_profit / total_revenue if total_revenue > 0 else 0

result = {{
    'total_revenue': float(total_revenue),
    'total_cost': float(total_cost),
    'total_profit': float(total_profit),
    'overall_margin': float(margin)
}}

if group_by:
    grouped = df.groupby(group_by).agg({{
        revenue_col: 'sum',
        cost_col: 'sum'
    }}).reset_index()
    grouped['profit'] = grouped[revenue_col] - grouped[cost_col]
    grouped['margin'] = grouped['profit'] / grouped[revenue_col]
    result['by_group'] = grouped.to_dict('records')

print(json.dumps(result))
'''

    elif analysis_type == 'production_chart':
        return f'''
import pandas as pd
import matplotlib.pyplot as plt
import json

# Load data
df = pd.read_csv("{file_path}")

# Create production vs design chart
actual_col = "{options.get('actual_col', 'actual_kwh')}"
design_col = "{options.get('design_col', 'design_kwh')}"
system_col = "{options.get('system_col', 'system_id')}"

fig, ax = plt.subplots(figsize=(12, 6))

x = range(len(df))
width = 0.35

ax.bar([i - width/2 for i in x], df[actual_col], width, label='Actual', color='#2E5090')
ax.bar([i + width/2 for i in x], df[design_col], width, label='Design', color='#90BE6D')

ax.set_xlabel('System')
ax.set_ylabel('Production (kWh)')
ax.set_title('Production vs Design')
ax.set_xticks(x)
ax.set_xticklabels(df[system_col] if system_col in df.columns else x)
ax.legend()
ax.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('production_chart.png', dpi=150)
plt.show()

# Calculate stats
perf_ratio = df[actual_col].sum() / df[design_col].sum()
underperformers = len(df[df[actual_col] / df[design_col] < 0.90])

print(json.dumps({{
    'performance_ratio': float(perf_ratio),
    'underperforming_systems': int(underperformers)
}}))
'''

    elif analysis_type == 'margin_chart':
        return f'''
import pandas as pd
import matplotlib.pyplot as plt
import json

# Load data
df = pd.read_csv("{file_path}")

# Calculate margin by group
group_col = "{options.get('group_col', 'trade')}"
revenue_col = "{options.get('revenue_col', 'revenue')}"
cost_col = "{options.get('cost_col', 'cost')}"

grouped = df.groupby(group_col).agg({{
    revenue_col: 'sum',
    cost_col: 'sum'
}})
grouped['margin'] = (grouped[revenue_col] - grouped[cost_col]) / grouped[revenue_col] * 100

# Create chart
fig, ax = plt.subplots(figsize=(10, 6))
colors = ['#2E5090' if m > 0 else '#E63946' for m in grouped['margin']]
bars = ax.bar(grouped.index, grouped['margin'], color=colors)

ax.set_xlabel(group_col.title())
ax.set_ylabel('Margin (%)')
ax.set_title(f'Profit Margin by {{group_col.title()}}')
ax.axhline(y=0, color='gray', linestyle='-', linewidth=0.5)
ax.grid(axis='y', alpha=0.3)

# Add value labels
for bar, val in zip(bars, grouped['margin']):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
            f'{{val:.1f}}%', ha='center', va='bottom', fontsize=10)

plt.tight_layout()
plt.savefig('margin_chart.png', dpi=150)
plt.show()

print(json.dumps(grouped['margin'].to_dict()))
'''

    else:
        return f'''
import pandas as pd
import json

# Load and preview data
df = pd.read_csv("{file_path}")
print("Data Preview:")
print(df.head().to_string())
print(f"\\nShape: {{df.shape}}")
print(f"Columns: {{list(df.columns)}}")
print(json.dumps({{"rows": len(df), "columns": list(df.columns)}}))
'''


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def analyze_utility_bill(file_path: Union[str, Path, bytes]) -> Dict[str, Any]:
    """
    Analyze a utility bill and provide solar sizing recommendation

    Usage:
        result = analyze_utility_bill("utility_bill.pdf")
        print(f"Recommended system: {result['sizing']['recommended_system_size_kw']} kW")
    """
    parser = UtilityBillParser()
    bill_data = parser.parse_utility_bill(file_path)

    calculator = SolarSizingCalculator()
    sizing = calculator.recommend_from_bill(bill_data)

    return {
        'bill_data': {
            'kwh_usage': bill_data.kwh_usage,
            'total_amount': bill_data.total_amount,
            'peak_demand_kw': bill_data.peak_demand_kw,
            'account_number': bill_data.account_number,
            'confidence': bill_data.confidence
        },
        'sizing': {
            'annual_kwh': sizing.annual_kwh,
            'recommended_system_size_kw': sizing.recommended_system_size_kw,
            'estimated_production_kwh': sizing.estimated_production_kwh,
            'offset_percentage': sizing.offset_percentage,
            'battery_recommendation_kwh': sizing.battery_recommendation_kwh,
            'roi_years': sizing.roi_years,
            'notes': sizing.notes
        }
    }


def extract_document_text(file_path: Union[str, Path, bytes]) -> str:
    """
    Extract text from any document (PDF, image)

    Usage:
        text = extract_document_text("invoice.pdf")
    """
    processor = OCRProcessor()

    if isinstance(file_path, bytes):
        if file_path[:4] == b'%PDF':
            result = processor.extract_text_from_pdf(file_path)
        else:
            result = processor.extract_text_from_image(file_path)
    else:
        ext = Path(file_path).suffix.lower()
        if ext == '.pdf':
            result = processor.extract_text_from_pdf(file_path)
        else:
            result = processor.extract_text_from_image(file_path)

    return result.text


# =============================================================================
# DEMO
# =============================================================================

def demo_data_analysis():
    """Demonstrate data analysis capabilities"""
    print("\n" + "="*60)
    print("DATA ANALYSIS & OCR DEMO")
    print("="*60 + "\n")

    # Check available capabilities
    print("Available Capabilities:")
    print(f"  OCR (pytesseract): {'Yes' if TESSERACT_AVAILABLE else 'No'}")
    print(f"  PDF OCR (pdf2image): {'Yes' if PDF2IMAGE_AVAILABLE else 'No'}")
    print(f"  Data Analysis (pandas): {'Yes' if PANDAS_AVAILABLE else 'No'}")
    print(f"  Image Processing (opencv): {'Yes' if CV2_AVAILABLE else 'No'}")
    print()

    if PANDAS_AVAILABLE:
        # Demo data analysis
        print("Demo: Profitability Analysis")
        print("-" * 40)

        # Create sample data
        data = pd.DataFrame({
            'trade': ['HVAC', 'HVAC', 'Solar', 'Solar', 'Electrical'],
            'job_type': ['Install', 'Service', 'Install', 'Install', 'Install'],
            'revenue': [15000, 500, 25000, 18000, 8000],
            'cost': [10000, 200, 15000, 12000, 5000]
        })

        engine = DataAnalysisEngine()
        result = engine.calculate_profitability(
            data,
            revenue_col='revenue',
            cost_col='cost',
            group_by='trade'
        )

        print(f"Total Revenue: ${result['total_revenue']:,.2f}")
        print(f"Total Cost: ${result['total_cost']:,.2f}")
        print(f"Total Profit: ${result['total_profit']:,.2f}")
        print(f"Overall Margin: {result['overall_margin']*100:.1f}%")
        print("\nBy Trade:")
        for item in result.get('by_group', []):
            print(f"  {item['trade']}: {item['margin']*100:.1f}% margin")

    print("\n" + "="*60)
    print("DEMO COMPLETE")
    print("="*60 + "\n")


if __name__ == "__main__":
    demo_data_analysis()
