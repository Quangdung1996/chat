using Ezy.APIService.SQLLogCore.SQLServices;
using Ezy.Module.Library.Utilities;
using System;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;

namespace SourceAPI.Core.Utilities
{
    public static class EzyStringHelper
    {
        public static string RefineKeepOnlyNumber(this string stringNumber)
        {
            var result = Regex.Replace(stringNumber, @"\D+", string.Empty);
            return result.Trim();
        }

        public static string ToCurrencyString(decimal? d)
        {
            var text = "";
            var cul = CultureInfo.CreateSpecificCulture("vi-VN");
            text = d.Value.ToString("#,###.##", cul);
            return text;
        }

        public static string FilterString_CombineArrayString(params string[] arrays)
        {
            string sresult = "";
            if (arrays != null)
            {
                arrays = arrays.Where(c => !string.IsNullOrEmpty(c)).Select(c => c.Trim(';')).ToArray();
            }
            if (arrays != null && arrays.Length > 0)
            {
                sresult = StringHelper.CombineArrayString(";", arrays);
                sresult = FilterString_Refine(sresult);
            }

            return sresult;
        }

        public static string FilterString_Refine(string sValue)
        {
            string sresult = sValue;
            if (!string.IsNullOrEmpty(sresult))
            {
                sresult = sresult.Trim();
                if (!sValue.EndsWith(";"))
                {
                    sresult = sresult + ";";
                }
                if (!sValue.StartsWith(";"))
                {
                    sresult = ";" + sresult;
                }
            }
            return sresult;
        }

        public static string UrlDecode(string text)
        {
            // pre-process for + sign space formatting since System.Uri doesn't handle it
            // plus literals are encoded as %2b normally so this should be safe
            text = text.Replace("+", " ");
            return System.Uri.UnescapeDataString(text);
        }

        public static string UnescapeDataString(string sEndCode)
        {
            string sResult = sEndCode;
            try
            {
                //  sEndCode = sEndCode.Replace("+", " ");
                sResult = System.Uri.UnescapeDataString(sEndCode);
            }
            catch (Exception ex)
            {
                SQLLogExceptionHelper.LogException(ex, "UnescapeDataString", "", sEndCode);
            }
            return sResult;
        }
        public static string[] Split_SoezyIds(string sText)
        {
            var _IM_SoezyIds = new string[0];
            if (!string.IsNullOrEmpty(sText))
            {
                _IM_SoezyIds = sText.Split(new char[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).Select(c => c.Trim()).Distinct().ToArray();
            }
            return _IM_SoezyIds;
        }
    }

    public static class EzyExceptionHelper
    {
        public static string GetMessage(Exception ex)
        {
            string sError = ex.Message;
            return sError;
        }
    }
}
