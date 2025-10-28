//using DevExpress.XtraReports.UI;
//using Ezy.APIService.Core.DataInfo;
//using SourceAPI.Shared.Helper;
//using System;
//using System.IO;

//namespace SourceAPI.Shared.Services
//{
//    public static class ReportDevexpressHelper
//    {
//        public static void SetParameterValue(this XtraReport report, string Key, object Value)
//        {
//            try
//            {
//                report.Parameters[Key].Value = Value;
//            }
//            catch (Exception ex)
//            {
//                SQLDataContextHelper.LogException<XtraReport>(ex, "SetParameterValue - Report Devexpress", Key);
//            }
//        }

//        public static void SetReportHeaderProjectForSub(XtraReport report, string Title, ReportOrientation ReportDesign, string sProjectId, SolidStaffInfo user)
//        {
//            string ReporFileName = (ReportDesign == ReportOrientation.Landscape ? "SubReportProjectHeader_Landscape.repx" : "SubReportProjectHeader_Portrait.repx");
//            string ReporFileName_FullPath = ReportingServiceHelper.GetFullPathReportTemplate(ReporFileName);
//            if (File.Exists(ReporFileName_FullPath))
//            {
//                XRSubreport subrp = report.Bands[BandKind.ReportHeader].FindControl("subreport1", true) as XRSubreport;
//                if (subrp != null)
//                {
//                    subrp.ReportSource = new XtraReport();
//                    subrp.ReportSource.LoadLayout(ReporFileName_FullPath);
//                }
//                else
//                {
//                    report.Parameters["Title"].Value = Title;
//                }
//            }
//        }
//    }

//    public enum ReportOrientation : int
//    {
//        Portrait = 1,

//        Landscape = 2
//    }
//}