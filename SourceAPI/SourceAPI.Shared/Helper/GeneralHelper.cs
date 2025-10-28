using Ezy.APIService.CoreUtilities.Utilities;
using Ezy.Module.Library.Utilities;
using System;
using System.Text.RegularExpressions;

namespace SourceAPI.Shared.Helper
{
    public static class GeneralHelper
    {
        public static long? ID_ConvertStringToPKId(string sId)
        {
            long? result = null;
            if (!string.IsNullOrEmpty(sId))
            {
                result = SQLDataContextHelper.ConvertStringToPKId(sId);
            }
            return result;
        }
        // public const string DateFormatString = "yyyy-MM-dd";
        /// <summary>
        /// date yyyy-MM-dd
        /// </summary>
        /// <param name="datetime"></param>
        /// <returns></returns>
        public static DateTime? DateOnly_ToServer(string sDate)
        {
            DateTime? dResult = EzyClientUtilityManager.DateOnly_ToServer(sDate);
            //var date = DateTime.Now;
            //if (!string.IsNullOrEmpty(sDate))
            //{
            //    sDate = sDate.Trim();
            //    if (DateTime.TryParseExact(sDate, DateFormatString, System.Globalization.CultureInfo.InvariantCulture,
            //        System.Globalization.DateTimeStyles.None, out date))
            //    {
            //        dResult = date;
            //    }
            //}
            return dResult;
        }
        public static string DateOnly_ToClient(DateTime? date)
        {
            string sText = string.Empty;
            sText = EzyClientUtilityManager.DateOnly_ToClient(date);
            return sText;
        }
        public static double? DateTime_ToClient(DateTime? date)
        {
            return EzyBaseDateTimeHelper.DateTime_FromServerToClient(date);
        }
        public static DateTime? DateTime_ToServer(double? datetime)
        {
            return EzyBaseDateTimeHelper.DateTime_FromClientToServer_SQL(datetime);
        }
        public static string ID_ConvertToStringId(object id)
        {
            string result = null;
            if (id != null)
            {
                result = id.ToString();
            }
            return result;
        }
        public static DateTime? DateTime_ReportRefine_From(DateTime? date)
        {
            if (date != null)
            {
                date = date.Value.Date;
            }
            return date;
        }
        public static DateTime? DateTime_ToServer_From(double? dClientDate)
        {
            var d = DateTime_ToServer(dClientDate);
            d = EzyDateTimeHelper.DateTime_ReportRefine_From(d);
            return d;
        }

        //public static string MsgShowInUI_Date(DateTime? DateFrom, DateTime? DateTo, string format = "dd/MM/yyyy")
        public static string MsgShowInUI_Date(DateTime? DateFrom, DateTime? DateTo, string format = FormatHelper.DateDisplay_dd_Slash_MM_Slash_yyyy)
        {
            string result = "";
            if (DateFrom.HasValue)
            {
                result = $"From Date {DateFrom.Value.ToString(format)}";
            }
            if (DateTo.HasValue)
            {
                result = $"{result} To Date {DateTo.Value.ToString(format)}";
            }
            return result;
        }

        public static void GetDefaultReportDate(out DateTime? datefrom, out DateTime? dateto)
        {
            dateto = DateTime.Today.AddDays(1).AddSeconds(-1);
            datefrom = new DateTime(dateto.Value.Year, 1, 1);
        }

        private static string RefineString(string text)
        {
            if (!string.IsNullOrEmpty(text))
            {
                text = StringHelper.RemoveSpecialCharacters(text);
                var rg = new Regex("[ ]{2,}");
                text = rg.Replace(text, " ");
            }
            return text;
        }
        public static DateTime? DateTime_TryParse(string sDate, string sFormat)
        {
            DateTime? dResult = null;
            var date = DateTime.Now;
            if (!string.IsNullOrEmpty(sDate) && !string.IsNullOrEmpty(sFormat))
            {
                sDate = sDate.Trim();
                if (DateTime.TryParseExact(sDate, sFormat, System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.None, out date))
                {
                    dResult = date;
                }
            }
            return dResult;
        }
    }
}