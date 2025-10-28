//using Ezy.APIService.Shared.Helper;
//using Ezy.APIService.Shared.Models;
//using Ezy.APIService.SQLLogCore.SQLServices;
//using Ezy.Module.Library.Data;
//using Ezy.Module.Library.Utilities;
//using SourceAPI.Core.DataInfo.Cached;
//using SourceAPI.Core.Utilities;
//using SourceAPI.Shared.Services;
//using System;
//using System.Collections.Generic;
//using System.Linq;

//namespace SourceAPI.Shared.Helper
//{
//    public class ReportExportResultToClientListModel : ReportExportResultToClientModel
//    { 
//        public string[] FullPathList { get; set; }
//    }
//    public enum eConfigEntityName
//    {
        
//    }
//    public class LogLogicErrorModel : IEzyLogicErrorItem
//    {
//        public string Method { get; set; }
//        public string Message { get; set; }
//        public string ClientData { get; set; }
//        public string Note { get; set; }
//        public DateTime StartAt { get; set; }
//        public string MainEntityType { get; set; }
//        public string MainEntityId { get; set; }
//    }

//    public class ReportingServiceHelper
//    {
//        //public static string ReportDateStringFormat = "dd/MM/yyyy";
//        public static string ReportDateStringFormat = FormatHelper.DateDisplay_dd_Slash_MM_Slash_yyyy;
//        public static string GetReportDateFormatString(DateTime? date, string sFormat = "")
//        {
//            string sResult = string.Empty;
//            if (date == null)
//                sResult = "";
//            else
//            {
//                if (!string.IsNullOrEmpty(sFormat))
//                    sResult = FormatHelper.FormatDateTime(date, sFormat);
//                else
//                    sResult = FormatHelper.FormatDateTime(date, ReportDateStringFormat);
//            }
//            return sResult;
//        }
//        public static long?[] GetIdConfigWithCodeList(eConfigEntityName entity, string codeList)
//        {
//            List<long?> result = new List<long?>();
//            var codes = codeList.Split(",").ToArray();
//            foreach(var code in codes)
//            {
//                result.Add(GetIdConfigWithCode(entity, code, out string name));
//            }
//            return result.Distinct().ToArray();
//        }
//        public static long? GetIdConfigWithCode(eConfigEntityName entity, string code)
//        {
//            return GetIdConfigWithCode(entity, code, out string Name);
//        }
//        public static long? GetIdConfigWithCode(eConfigEntityName entity, string code, out string name)
//        {
//            long? Id = null;
//            name = string.Empty;
//            try
//            {
//                if(!string.IsNullOrEmpty(code))
//                {
//                    if (!Id.HasValue)
//                    {
//                        //Save Log để biết đây là lỗi logic data config không đúng
//                        EzyBaseThreadHelper.RunActionInBackground(() =>
//                        {
//                            var error = SQLLogLogicErrorHelper.LogError(new LogLogicErrorModel()
//                            {
//                                ClientData = code,
//                                Message = "Can't find data",
//                                Method = "GetIdConfigWithCode",
//                                StartAt = DateTime.Now
//                            }, entity.ToString(), "System");
//                        });
//                    }
//                }
//            }
//            catch(Exception ex)
//            {
//                SQLDataContextHelper.LogException(ex, "GetIdConfigWithCode", "System", code);
//            }
//            return Id;
//        }
//        public static byte[] ReadContentFileGeneric(string sFullPath)
//        {
//            byte[] content = IOHelper.GetFileContentBytes(sFullPath);
//            return content;
//        }

//        public static byte[] GenerateDataFromReportingService(string sReportName, Action<ReportingService> action_AddParameter, Action<ReportingService> action_SetDataSource, string sExportType)
//        {
//            try
//            {
//                ReportingService rs = new ReportingService();

//                // lay file report template raa
//                string sTemplateFile = sReportName;
//                byte[] content = ReadContentFileGeneric(sTemplateFile);

//                rs.LoadLocalReportFromBinary(content);
//                if (action_AddParameter != null)
//                {
//                    action_AddParameter(rs);
//                }
//                if (action_SetDataSource != null)
//                {
//                    action_SetDataSource(rs);
//                }
//                var data = rs.ReportExport(sExportType, new ExcelDeviceInfo());

//                return data;
//            }
//            catch (Exception ex)
//            {
//                SQLDataContextHelper.LogException<ReportingServiceHelper>(ex, "GenerateDataFromReportingService", "", sReportName);
//                return null;
//            }
//        }

//        public static string GetExtension(string sExportType)
//        {
//            switch (sExportType)
//            {
//                case RSExportType.CSV:
//                    return "csv";

//                case RSExportType.EXCEL:
//                    return "xls";

//                case RSExportType.EXCEL_2013:
//                    return "xlsx";

//                case RSExportType.HTML3_2:
//                    return "html";

//                case RSExportType.HTML4_0:
//                    return "html";

//                case RSExportType.IMAGE:
//                    return "jpeg";

//                case RSExportType.MHTML:
//                    return "mhtml";

//                case RSExportType.NULL:
//                    return "";

//                case RSExportType.PDF:
//                    return "pdf";

//                case RSExportType.RGDI:
//                    return "rgdi";

//                case RSExportType.WORD:
//                    return "doc";

//                case RSExportType.XML:
//                    return "xml";
//            }
//            return "";
//        }

//        public static string GetFullPath(string sReportName)
//        {
//            string sRoot = EzyPictureHelper.Get_ROOT_FOLDER();
//            string sFullPath = IOHelper.PathCombine(sRoot, "reports", sReportName);

//            return sFullPath;
//        }

//        public static string GetFullPathReportTemplate(string sReportName)
//        {
//            string sFullPath = "";
//            sFullPath = IOHelper.PathCombine(AppDomain.CurrentDomain.BaseDirectory, "ReportTemplate", sReportName);
//            return sFullPath;
//        }
//    }
//}