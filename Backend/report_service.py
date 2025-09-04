import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import PageBreak
import base64
import tempfile
import os
from PIL import Image as PILImage

class ReportService:
    def __init__(self):
        self.crack_solutions = {
            'horizontal crack': {
                'causes': [
                    'Thermal expansion and contraction cycles',
                    'Foundation settlement or movement', 
                    'Excessive load bearing stress',
                    'Inadequate structural support',
                    'Age-related material deterioration'
                ],
                'solutions': [
                    'Apply flexible polyurethane sealant for minor cracks (width < 2mm)',
                    'Use structural epoxy injection for moderate cracks (2-5mm)',
                    'Install steel reinforcement plates for major structural cracks',
                    'Consider complete section replacement for severe damage',
                    'Implement stress distribution measures'
                ],
                'prevention': [
                    'Design proper expansion joints during construction',
                    'Ensure adequate foundation design and soil analysis',
                    'Regular maintenance and inspection schedules',
                    'Control thermal movement with appropriate materials',
                    'Monitor structural loads and weight distribution'
                ],
                'severity': 'Medium to High',
                'urgency': 'Address within 3-6 months'
            },
            'vertical crack': {
                'causes': [
                    'Structural loading and stress concentration',
                    'Material shrinkage during curing',
                    'Seismic activity and ground movement',
                    'Improper construction techniques',
                    'Water infiltration and freeze-thaw cycles'
                ],
                'solutions': [
                    'Inject structural epoxy resin for load-bearing cracks',
                    'Apply surface sealers for cosmetic vertical cracks',
                    'Install carbon fiber reinforcement strips',
                    'Use steel plate bonding for critical structural areas',
                    'Implement waterproofing measures'
                ],
                'prevention': [
                    'Proper structural design with adequate reinforcement',
                    'Quality control during concrete mixing and placement',
                    'Regular structural health monitoring',
                    'Seismic design considerations in earthquake-prone areas',
                    'Proper drainage and waterproofing systems'
                ],
                'severity': 'High',
                'urgency': 'Address within 1-3 months'
            },
            'unprecidented crack': {
                'causes': [
                    'Complex multi-directional stress patterns',
                    'Multiple simultaneous failure modes',
                    'Unusual environmental conditions',
                    'Design or construction defects',
                    'Unexpected loading conditions'
                ],
                'solutions': [
                    'Conduct detailed structural analysis by qualified engineer',
                    'Implement temporary support measures immediately',
                    'Develop custom repair solution based on analysis',
                    'Install continuous monitoring systems',
                    'Consider professional structural assessment'
                ],
                'prevention': [
                    'Advanced structural modeling and analysis',
                    'Regular professional inspections by structural engineers',
                    'Environmental protection and monitoring measures',
                    'Implementation of structural health monitoring systems',
                    'Adherence to latest building codes and standards'
                ],
                'severity': 'Critical',
                'urgency': 'Immediate attention required'
            }
        }
    
    def _save_base64_image(self, base64_string):
        """Save base64 image to temporary file and return path"""
        try:
            # Handle HTML links from video results
            if '<a href="' in base64_string and 'data:image' in base64_string:
                # Extract base64 data from HTML link
                import re
                match = re.search(r'href="(data:image[^"]+)"', base64_string)
                if match:
                    base64_string = match.group(1)
            
            if base64_string.startswith('data:image'):
                base64_string = base64_string.split(',')[1]
            
            image_data = base64.b64decode(base64_string)
            
            # Create temp file with proper handling
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png', mode='wb')
            temp_file.write(image_data)
            temp_file.flush()  # Ensure data is written
            temp_file.close()
            
            # Verify file exists
            if not os.path.exists(temp_file.name):
                raise FileNotFoundError(f"Temporary file was not created: {temp_file.name}")
            
            return temp_file.name
        except Exception as e:
            print(f"Error saving base64 image: {str(e)}")
            raise e
    
    def generate_report(self, detection_result, image_base64=None):
        """Generate PDF report for crack detection results"""
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch)
            styles = getSampleStyleSheet()
            story = []
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                alignment=1,  # Center
                textColor=colors.darkblue
            )
            
            subtitle_style = ParagraphStyle(
                'CustomSubtitle',
                parent=styles['Heading2'],
                fontSize=16,
                spaceAfter=15,
                textColor=colors.darkred
            )
            
            # Title
            story.append(Paragraph("Crack Detection Analysis Report", title_style))
            story.append(Spacer(1, 20))
            
            # Report metadata
            current_time = datetime.now()
            report_info = [
                ['Report Generated:', current_time.strftime('%Y-%m-%d %H:%M:%S')],
                ['Crack Type Detected:', detection_result['crack_type'].title()],
                ['Detection Confidence:', f"{detection_result.get('confidence', 0) * 100:.1f}%"],
                ['Analysis Status:', 'Complete']
            ]
            
            info_table = Table(report_info, colWidths=[2.5*inch, 3*inch])
            info_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.lightblue),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(info_table)
            story.append(Spacer(1, 20))
            
            # Add detection image if provided
            temp_image_path = None
            if image_base64:
                story.append(Paragraph("Detected Crack Image:", subtitle_style))
                try:
                    temp_image_path = self._save_base64_image(image_base64)
                    print(f"Temporary image saved to: {temp_image_path}")
                    
                    # Verify file exists before creating Image object
                    if os.path.exists(temp_image_path):
                        img = Image(temp_image_path, width=4*inch, height=3*inch)
                        story.append(img)
                        story.append(Spacer(1, 20))
                    else:
                        print(f"Warning: Temporary image file not found: {temp_image_path}")
                        story.append(Paragraph("Error: Could not load detection image", styles['Normal']))
                        story.append(Spacer(1, 10))
                        
                except Exception as e:
                    print(f"Error processing image: {str(e)}")
                    story.append(Paragraph(f"Error loading image: {str(e)}", styles['Normal']))
                    story.append(Spacer(1, 10))
            
            # Get crack-specific information
            crack_type = detection_result['crack_type'].lower()
            # Handle different crack type variations
            if 'horizontal' in crack_type:
                crack_key = 'horizontal crack'
            elif 'vertical' in crack_type:
                crack_key = 'vertical crack'
            elif 'unprecidented' in crack_type or 'unprecedented' in crack_type:
                crack_key = 'unprecidented crack'
            else:
                crack_key = 'unprecidented crack'  # Default fallback
                
            crack_info = self.crack_solutions.get(crack_key, self.crack_solutions['unprecidented crack'])
            
            # Severity and urgency
            story.append(Paragraph("Risk Assessment:", subtitle_style))
            risk_info = [
                ['Severity Level:', crack_info['severity']],
                ['Action Timeline:', crack_info['urgency']]
            ]
            
            risk_table = Table(risk_info, colWidths=[2.5*inch, 3*inch])
            risk_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.lightyellow),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(risk_table)
            story.append(Spacer(1, 20))
            
            # Possible causes
            story.append(Paragraph("Possible Causes:", subtitle_style))
            for i, cause in enumerate(crack_info['causes'], 1):
                story.append(Paragraph(f"{i}. {cause}", styles['Normal']))
            story.append(Spacer(1, 20))
            
            # Recommended solutions
            story.append(Paragraph("Recommended Solutions:", subtitle_style))
            for i, solution in enumerate(crack_info['solutions'], 1):
                story.append(Paragraph(f"{i}. {solution}", styles['Normal']))
            story.append(Spacer(1, 20))
            
            # Prevention measures
            story.append(Paragraph("Prevention Measures:", subtitle_style))
            for i, prevention in enumerate(crack_info['prevention'], 1):
                story.append(Paragraph(f"{i}. {prevention}", styles['Normal']))
            
            story.append(Spacer(1, 30))
            
            # Footer
            story.append(Paragraph("Important Note:", subtitle_style))
            story.append(Paragraph(
                "This report is generated by an AI-powered crack detection system. "
                "For critical structural decisions, always consult with a qualified structural engineer. "
                "Regular monitoring and professional assessment are recommended.",
                styles['Normal']
            ))
            
            # Build PDF
            doc.build(story)
            buffer.seek(0)
            
            # Clean up temporary image file after PDF is built
            if temp_image_path and os.path.exists(temp_image_path):
                try:
                    os.unlink(temp_image_path)
                    print(f"Cleaned up temporary image: {temp_image_path}")
                except Exception as e:
                    print(f"Warning: Could not delete temporary file {temp_image_path}: {str(e)}")
            
            return buffer
            
        except Exception as e:
            print(f"Error in generate_report: {str(e)}")
            import traceback
            traceback.print_exc()
            raise e
    
    def get_crack_preview(self, crack_type):
        """Get preview information for crack type"""
        crack_type = crack_type.lower()
        # Handle different crack type variations
        if 'horizontal' in crack_type:
            crack_key = 'horizontal crack'
        elif 'vertical' in crack_type:
            crack_key = 'vertical crack'
        elif 'unprecidented' in crack_type or 'unprecedented' in crack_type:
            crack_key = 'unprecidented crack'
        else:
            crack_key = 'unprecidented crack'  # Default fallback
            
        crack_info = self.crack_solutions.get(crack_key, self.crack_solutions['unprecidented crack'])
        
        return {
            'crack_type': crack_type,
            'severity': crack_info['severity'],
            'urgency': crack_info['urgency'],
            'causes': crack_info['causes'],
            'solutions': crack_info['solutions'],
            'prevention': crack_info['prevention']
        }
    
    def generate_batch_report(self, batch_results):
        """Generate PDF report for batch processing results"""
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch)
            styles = getSampleStyleSheet()
            story = []
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                alignment=1,
                textColor=colors.darkblue
            )
            
            subtitle_style = ParagraphStyle(
                'CustomSubtitle',
                parent=styles['Heading2'],
                fontSize=16,
                spaceAfter=15,
                textColor=colors.darkred
            )
            
            # Title
            story.append(Paragraph("Batch Crack Detection Analysis Report", title_style))
            story.append(Spacer(1, 20))
            
            # Report metadata
            current_time = datetime.now()
            total_images = len(batch_results)
            cracked_images = len([r for r in batch_results if r.get('cracked', False)])
            
            report_info = [
                ['Report Generated:', current_time.strftime('%Y-%m-%d %H:%M:%S')],
                ['Total Images Processed:', str(total_images)],
                ['Images with Cracks:', str(cracked_images)],
                ['Images without Cracks:', str(total_images - cracked_images)],
                ['Analysis Type:', 'Batch Processing']
            ]
            
            info_table = Table(report_info, colWidths=[2.5*inch, 3*inch])
            info_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.lightblue),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(info_table)
            story.append(Spacer(1, 20))
            
            # Summary by crack type
            crack_summary = {}
            for result in batch_results:
                if result.get('cracked', False) and result.get('orientation'):
                    crack_type = result['orientation']
                    crack_summary[crack_type] = crack_summary.get(crack_type, 0) + 1
            
            if crack_summary:
                story.append(Paragraph("Crack Type Summary:", subtitle_style))
                summary_data = [['Crack Type', 'Count']]
                for crack_type, count in crack_summary.items():
                    summary_data.append([crack_type, str(count)])
                
                summary_table = Table(summary_data, colWidths=[3*inch, 1*inch])
                summary_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 14),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ]))
                story.append(summary_table)
                story.append(Spacer(1, 30))
            
            # Detailed results
            story.append(Paragraph("Detailed Analysis Results:", subtitle_style))
            story.append(Spacer(1, 12))
            
            # Store temporary files for cleanup after PDF generation
            temp_files_to_cleanup = []
            
            for i, result in enumerate(batch_results, 1):
                if result.get('cracked', False):
                    crack_type = result.get('orientation', 'Unknown')
                    
                    # Fix the duplicate "crack" word issue
                    if 'crack' in crack_type.lower():
                        heading_text = f"Image {i}: {crack_type.title()} Detected"
                    else:
                        heading_text = f"Image {i}: {crack_type.title()} Crack Detected"
                    
                    # Get crack-specific information
                    crack_key = self._get_crack_key(crack_type)
                    crack_info = self.crack_solutions.get(crack_key, self.crack_solutions['unprecidented crack'])
                    
                    # Handle annotated image first
                    img_flowable = None
                    if result.get('annotated_image'):
                        try:
                            temp_image_path = self._save_base64_image(result['annotated_image'])
                            if temp_image_path:
                                temp_files_to_cleanup.append(temp_image_path)
                            
                            if temp_image_path and os.path.exists(temp_image_path):
                                img_flowable = Image(temp_image_path, width=2.5*inch, height=1.8*inch)
                                
                        except Exception as e:
                            print(f"Error processing annotated image for result {i}: {str(e)}")
                    
                    # Create header with image on the right
                    if img_flowable:
                        header_data = [[
                            Paragraph(heading_text, styles['Heading3']),
                            img_flowable
                        ]]
                        
                        header_table = Table(header_data, colWidths=[3.5*inch, 2.5*inch])
                        header_table.setStyle(TableStyle([
                            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                            ('ALIGN', (1, 0), (1, 0), 'CENTER'),
                            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                            ('LEFTPADDING', (0, 0), (-1, -1), 0),
                            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                            ('TOPPADDING', (0, 0), (-1, -1), 3),
                            ('BOTTOMPADDING', (0, 0), (-1, -1), 3)
                        ]))
                        
                        story.append(header_table)
                    else:
                        story.append(Paragraph(heading_text, styles['Heading3']))
                    
                    story.append(Spacer(1, 8))
                    
                    # Create compact details layout
                    details_data = [
                        ['Severity:', crack_info['severity'], 'Urgency:', crack_info['urgency']]
                    ]
                    
                    details_table = Table(details_data, colWidths=[1*inch, 1.5*inch, 1*inch, 1.5*inch])
                    details_table.setStyle(TableStyle([
                        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                        ('FONTSIZE', (0, 0), (-1, -1), 9),
                        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
                        ('FONTNAME', (2, 0), (2, 0), 'Helvetica-Bold'),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ('LEFTPADDING', (0, 0), (-1, -1), 2),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
                        ('TOPPADDING', (0, 0), (-1, -1), 3),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                        ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey)
                    ]))
                    
                    story.append(details_table)
                    story.append(Spacer(1, 8))
                    
                    # Add crack details in compact format
                    story.append(Paragraph("<b>Possible Causes:</b>", styles['Heading4']))
                    for cause in crack_info['causes']:
                        story.append(Paragraph(f"• {cause}", styles['Normal']))
                    story.append(Spacer(1, 6))
                    
                    story.append(Paragraph("<b>Recommended Solutions:</b>", styles['Heading4']))
                    for solution in crack_info['solutions']:
                        story.append(Paragraph(f"• {solution}", styles['Normal']))
                    story.append(Spacer(1, 6))
                    
                    story.append(Paragraph("<b>Prevention Measures:</b>", styles['Heading4']))
                    for prevention in crack_info['prevention']:
                        story.append(Paragraph(f"• {prevention}", styles['Normal']))
                    
                    story.append(Spacer(1, 15))  # Reduced spacing between images
                    
                else:
                    story.append(Paragraph(f"Image {i}: No Crack Detected", styles['Heading3']))
                    story.append(Paragraph("No specific recommendations required for this image.", styles['Normal']))
                    story.append(Spacer(1, 10))  # Reduced spacing for non-cracked images
            
            # General recommendations
            story.append(Paragraph("General Recommendations:", subtitle_style))
            story.append(Paragraph(
                "1. Prioritize repairs based on crack severity levels indicated in the detailed analysis.",
                styles['Normal']
            ))
            story.append(Paragraph(
                "2. Conduct regular monitoring of all detected crack locations.",
                styles['Normal']
            ))
            story.append(Paragraph(
                "3. Consult with a qualified structural engineer for critical repairs.",
                styles['Normal']
            ))
            story.append(Paragraph(
                "4. Implement preventive measures to avoid future crack development.",
                styles['Normal']
            ))
            
            # Build PDF
            doc.build(story)
            
            # Clean up temporary files after PDF is built
            for temp_file in temp_files_to_cleanup:
                if temp_file and os.path.exists(temp_file):
                    try:
                        os.remove(temp_file)
                    except Exception as cleanup_error:
                        print(f"Warning: Could not clean up temporary file {temp_file}: {cleanup_error}")
            
            buffer.seek(0)
            return buffer
            
        except Exception as e:
            print(f"Error in generate_batch_report: {str(e)}")
            import traceback
            traceback.print_exc()
            raise e
    
    def _add_text_only_crack_details(self, story, crack_type, styles):
        """Helper method to add crack details in text-only format"""
        crack_key = self._get_crack_key(crack_type)
        crack_info = self.crack_solutions.get(crack_key, self.crack_solutions['unprecidented crack'])
        
        story.append(Paragraph(f"<b>Severity:</b> {crack_info['severity']}", styles['Normal']))
        story.append(Paragraph(f"<b>Urgency:</b> {crack_info['urgency']}", styles['Normal']))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("<b>Possible Causes:</b>", styles['Heading4']))
        for cause in crack_info['causes']:
            story.append(Paragraph(f"• {cause}", styles['Normal']))
        story.append(Spacer(1, 8))
        
        story.append(Paragraph("<b>Recommended Solutions:</b>", styles['Heading4']))
        for solution in crack_info['solutions']:
            story.append(Paragraph(f"• {solution}", styles['Normal']))
        story.append(Spacer(1, 8))
        
        story.append(Paragraph("<b>Prevention Measures:</b>", styles['Heading4']))
        for prevention in crack_info['prevention']:
            story.append(Paragraph(f"• {prevention}", styles['Normal']))
    
    def _add_video_text_only_details(self, story, result, crack_type, styles):
        """Helper method to add video frame crack details in text-only format"""
        frame_num = result.get('Frame #', 'N/A')
        timestamp = result.get('Timestamp (s)', 'N/A')
        
        crack_key = self._get_crack_key(crack_type)
        crack_info = self.crack_solutions.get(crack_key, self.crack_solutions['unprecidented crack'])
        
        story.append(Paragraph(f"<b>Frame Details:</b>", styles['Heading4']))
        story.append(Paragraph(f"Frame Number: {frame_num}", styles['Normal']))
        story.append(Paragraph(f"Timestamp: {timestamp}s", styles['Normal']))
        story.append(Paragraph(f"Crack Type: {crack_type}", styles['Normal']))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph(f"<b>Severity:</b> {crack_info['severity']}", styles['Normal']))
        story.append(Paragraph(f"<b>Urgency:</b> {crack_info['urgency']}", styles['Normal']))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("<b>Possible Causes:</b>", styles['Heading4']))
        for cause in crack_info['causes']:
            story.append(Paragraph(f"• {cause}", styles['Normal']))
        story.append(Spacer(1, 8))
        
        story.append(Paragraph("<b>Recommended Solutions:</b>", styles['Heading4']))
        for solution in crack_info['solutions']:
            story.append(Paragraph(f"• {solution}", styles['Normal']))
        story.append(Spacer(1, 8))
        
        story.append(Paragraph("<b>Prevention Measures:</b>", styles['Heading4']))
        for prevention in crack_info['prevention']:
            story.append(Paragraph(f"• {prevention}", styles['Normal']))
    
    def generate_video_report(self, video_results):
        """Generate PDF report for video processing results"""
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch)
            styles = getSampleStyleSheet()
            story = []
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                alignment=1,
                textColor=colors.darkblue
            )
            
            subtitle_style = ParagraphStyle(
                'CustomSubtitle',
                parent=styles['Heading2'],
                fontSize=16,
                spaceAfter=15,
                textColor=colors.darkred
            )
            
            # Title
            story.append(Paragraph("Video Crack Detection Analysis Report", title_style))
            story.append(Spacer(1, 20))
            
            # Report metadata
            current_time = datetime.now()
            total_detections = len(video_results)
            
            report_info = [
                ['Report Generated:', current_time.strftime('%Y-%m-%d %H:%M:%S')],
                ['Total Crack Detections:', str(total_detections)],
                ['Analysis Type:', 'Video Processing'],
                ['Detection Method:', 'Frame-by-frame Analysis']
            ]
            
            info_table = Table(report_info, colWidths=[2.5*inch, 3*inch])
            info_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.lightblue),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(info_table)
            story.append(Spacer(1, 20))
            
            # Timeline analysis
            if video_results:
                story.append(Paragraph("Timeline Analysis:", subtitle_style))
                
                timeline_data = [['Frame #', 'Timestamp (s)', 'Crack Type']]
                for result in video_results:
                    frame_num = result.get('Frame #', 'N/A')
                    timestamp = result.get('Timestamp (s)', 'N/A')
                    crack_type = result.get('Classification', 'Unknown')
                    timeline_data.append([str(frame_num), str(timestamp), crack_type])
                
                timeline_table = Table(timeline_data, colWidths=[1.5*inch, 1.5*inch, 2.5*inch])
                timeline_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ]))
                story.append(timeline_table)
                story.append(Spacer(1, 30))
            
            # Crack type summary
            crack_summary = {}
            for result in video_results:
                crack_type = result.get('Classification', 'Unknown')
                crack_summary[crack_type] = crack_summary.get(crack_type, 0) + 1
            
            if crack_summary:
                story.append(Paragraph("Crack Type Distribution:", subtitle_style))
                summary_data = [['Crack Type', 'Occurrences']]
                for crack_type, count in crack_summary.items():
                    summary_data.append([crack_type, str(count)])
                
                summary_table = Table(summary_data, colWidths=[3*inch, 1*inch])
                summary_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 14),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ]))
                story.append(summary_table)
                story.append(Spacer(1, 20))
            
            # Detailed Frame Analysis
            story.append(Paragraph("Detailed Frame Analysis:", subtitle_style))
            story.append(Spacer(1, 12))
            
            # Store temporary files for cleanup after PDF generation
            temp_files_to_cleanup = []
            
            for i, result in enumerate(video_results, 1):
                frame_num = result.get('Frame #', f'Frame {i}')
                timestamp = result.get('Timestamp (s)', 'N/A')
                crack_type = result.get('Classification', 'Unknown')
                
                # Fix the duplicate "crack" word issue
                if 'crack' in crack_type.lower():
                    heading_text = f"{frame_num} (Timestamp: {timestamp}s) - {crack_type.title()} Detected"
                else:
                    heading_text = f"{frame_num} (Timestamp: {timestamp}s) - {crack_type.title()} Crack Detected"
                
                # Get crack-specific information
                crack_key = self._get_crack_key(crack_type)
                crack_info = self.crack_solutions.get(crack_key, self.crack_solutions['unprecidented crack'])
                
                # Handle annotated image first
                img_flowable = None
                if result.get('Full Annotated Image'):
                    try:
                        temp_image_path = self._save_base64_image(result['Full Annotated Image'])
                        if temp_image_path:
                            temp_files_to_cleanup.append(temp_image_path)
                        
                        if temp_image_path and os.path.exists(temp_image_path):
                            img_flowable = Image(temp_image_path, width=2.5*inch, height=1.8*inch)
                    except Exception as e:
                        print(f"Error processing annotated frame for result {i}: {str(e)}")
                
                # Create header with image on the right
                if img_flowable:
                    header_data = [[
                        Paragraph(heading_text, styles['Heading3']),
                        img_flowable
                    ]]
                    
                    header_table = Table(header_data, colWidths=[3.5*inch, 2.5*inch])
                    header_table.setStyle(TableStyle([
                        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ('LEFTPADDING', (0, 0), (-1, -1), 0),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                        ('TOPPADDING', (0, 0), (-1, -1), 3),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 3)
                    ]))
                    
                    story.append(header_table)
                else:
                    story.append(Paragraph(heading_text, styles['Heading3']))
                
                story.append(Spacer(1, 8))
                
                # Create compact details layout
                details_data = [
                    ['Frame:', frame_num, 'Timestamp:', f"{timestamp}s"],
                    ['Severity:', crack_info['severity'], 'Urgency:', crack_info['urgency']]
                ]
                
                details_table = Table(details_data, colWidths=[1*inch, 1.5*inch, 1*inch, 1.5*inch])
                details_table.setStyle(TableStyle([
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
                    ('FONTNAME', (2, 0), (2, 0), 'Helvetica-Bold'),
                    ('FONTNAME', (0, 1), (0, 1), 'Helvetica-Bold'),
                    ('FONTNAME', (2, 1), (2, 1), 'Helvetica-Bold'),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 2),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 2),
                    ('TOPPADDING', (0, 0), (-1, -1), 3),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                    ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey)
                ]))
                
                story.append(details_table)
                story.append(Spacer(1, 8))
                
                # Add crack details in compact format
                story.append(Paragraph("<b>Possible Causes:</b>", styles['Heading4']))
                for cause in crack_info['causes']:
                    story.append(Paragraph(f"• {cause}", styles['Normal']))
                story.append(Spacer(1, 6))
                
                story.append(Paragraph("<b>Recommended Solutions:</b>", styles['Heading4']))
                for solution in crack_info['solutions']:
                    story.append(Paragraph(f"• {solution}", styles['Normal']))
                story.append(Spacer(1, 6))
                
                story.append(Paragraph("<b>Prevention Measures:</b>", styles['Heading4']))
                for prevention in crack_info['prevention']:
                    story.append(Paragraph(f"• {prevention}", styles['Normal']))
                
                story.append(Spacer(1, 15))  # Reduced spacing between frames
            
            # General Recommendations
            story.append(Paragraph("General Video Analysis Recommendations:", subtitle_style))
            story.append(Paragraph(
                "1. Focus inspection efforts on the timestamps where cracks were detected.",
                styles['Normal']
            ))
            story.append(Paragraph(
                "2. Conduct detailed physical inspection at the identified locations.",
                styles['Normal']
            ))
            story.append(Paragraph(
                "3. Monitor crack progression by comparing with future video analyses.",
                styles['Normal']
            ))
            story.append(Paragraph(
                "4. Prioritize repair actions based on crack type severity levels indicated above.",
                styles['Normal']
            ))
            
            # Build PDF
            doc.build(story)
            
            # Clean up temporary files after PDF is built
            for temp_file in temp_files_to_cleanup:
                if temp_file and os.path.exists(temp_file):
                    try:
                        os.remove(temp_file)
                    except Exception as cleanup_error:
                        print(f"Warning: Could not clean up temporary file {temp_file}: {cleanup_error}")
            
            buffer.seek(0)
            return buffer
            
        except Exception as e:
            print(f"Error in generate_video_report: {str(e)}")
            import traceback
            traceback.print_exc()
            raise e
    
    def _get_crack_key(self, crack_type):
        """Helper method to get crack key from crack type"""
        crack_type = crack_type.lower()
        if 'horizontal' in crack_type:
            return 'horizontal crack'
        elif 'vertical' in crack_type:
            return 'vertical crack'
        elif 'unprecidented' in crack_type or 'unprecedented' in crack_type:
            return 'unprecidented crack'
        else:
            return 'unprecidented crack'  # Default to unprecedented for unknown types
