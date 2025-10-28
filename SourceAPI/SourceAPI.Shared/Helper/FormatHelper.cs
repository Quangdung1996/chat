using Ezy.Module.Library.Utilities;
using System;
using System.Globalization;
using System.Reflection;

namespace SourceAPI.Shared.Helper
{
    public static class FormatHelper
    {
        private static CultureInfo cul = null;

        private static CultureItemInfo _CultureSystem = null;

        private static string _keyJson = "";
        public const string DateDisplay_MM_Slash_yyyy = "MM/yyyy";
        public const string DateDisplay_dd_Space_MMM_Space_yyyy = "dd MMM yyyy";
        public const string DateDisplay_dd_Slash_MM_Slash_yyyy = "dd/MM/yyyy";
        public const string DateDisplay_ddMMyyyy = "ddMMyyyy";
        public const string DateDisplay_dd_Dot_MM_Dot_yyyy = "dd.MM.yyyy";
        public const string DateDisplay_dd_Minus_MM_Minus_yyyy = "dd-MM-yyyy";
        public const string DateDisplay_ddMM_Dot_yyyy = "ddMM.yyyy";
        public const string DateDisplay_dd_Dot_MM_Dot_yy = "dd.MM.yy";
        public const string DateDisplay_ddMMyy = "ddMMyy";
        public const string DateDisplay_ddMMMyyyy = "ddMMMyyyy";
        public const string DateDisplay_d_Space_MMM_Space_yyyy = "d MMM yyyy";
        public const string DateDisplay_dd_Space_MMMyyyy = "dd MMMyyyy";
        public const string DateDisplay_dd_Slash_MM_Slash_yy = "dd/MM/yy";

        public const string DateTimeDisplay_dd_Slash_MM_Slash_yyyy_Space_HH_Colon_mm = "dd-MM-yyyy HH:mm";
        public const string DateTimeDisplay_dd_Space_MMM_Space_yyyy_Space_HH_Colon_mm = "dd MMM yyyy HH:mm";
        /// <summary>
        /// Get from SystemConfig
        /// - KEY = "CultureSystem"
        /// Muc tieu:xay dung CultureInfo cul
        /// </summary>
        public static CultureItemInfo CultureSystem
        {
            get
            {
                #region _CultureSystem

                if (_CultureSystem == null && !string.IsNullOrEmpty(_keyJson))
                {
                    //read system config
                    _CultureSystem = JsonHelper.DeserializeObject<CultureItemInfo>(_keyJson);
                }
                if (_CultureSystem == null)
                {
                    //default
                    _CultureSystem = new CultureItemInfo()
                    {
                        CultureName = "vi-VN"
                    };
                }

                #endregion _CultureSystem

                #region

                if (cul == null)
                {
                    cul = CultureInfo.GetCultureInfo(_CultureSystem.CultureName);
                }
                if (cul != null)
                {
                }

                #endregion

                return _CultureSystem;
            }
        }

        #region CulCurrency

        private static CultureInfo _CulCurrency = null;

        public static CultureInfo CulCurrency
        {
            get
            {
                if (_CulCurrency == null)
                {
                    _CulCurrency = cul.Clone() as CultureInfo;
                    _CulCurrency.NumberFormat.CurrencyDecimalDigits = 0;
                }
                return _CulCurrency;
            }
        }

        #endregion

        /// <summary>
        ///
        /// </summary>
        public static CultureItemInfo InitCulture(string keyJson)
        {
            _keyJson = keyJson;
            return CultureSystem;
        }

        public static void RefreshCache()
        {
            _CulCurrency = null;
        }

        public static string FormatNumber(decimal? d)
        {
            decimal value = d.HasValue ? d.Value : 0;
            var result = FormatNumber(value);
            if (result.StartsWith(","))
                result = $"0{result}";
            if (result.StartsWith("-,"))
                result = result.Replace("-,", "-0,");
            return result;
        }

        public static string FormatNumber(decimal d)
        {
            var f = "{0:N}";
            if (CultureSystem != null && !string.IsNullOrWhiteSpace(CultureSystem.Pattern_Number))
            {
                f = CultureSystem.Pattern_Number;
            }

            var result = String.Format(cul, f, d);
            return result;
        }

        public static string FormatNumber(decimal? d, string fconvert, bool formatMinus)
        {
            decimal value = d.HasValue ? d.Value : 0;
            return FormatNumber(value, fconvert, formatMinus);
        }

        public static string FormatNumber(decimal d, string fconvert)
        {
            return FormatNumber(d, fconvert, false);
        }

        public static string FormatNumber(decimal d, string fconvert, bool formatMinus)
        {
            string result = string.Empty;
            result = d.ToString(fconvert);
            if (d < 0 && formatMinus)
            {
                result = $"({result})";
            }
            return result;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="d"></param>
        /// <returns></returns>
        public static string FormatCurrency(decimal? d)
        {
            decimal value = d.HasValue ? d.Value : 0;
            return FormatCurrency(value, false);
        }

        public static string FormatCurrency(decimal d)
        {
            return FormatCurrency(d, false);
        }

        public static string FormatCurrency(decimal d, bool formatMinus)
        {
            var f = "{0:C}";
            if (CultureSystem != null && !string.IsNullOrWhiteSpace(CultureSystem.Pattern_Currency))
            {
                f = CultureSystem.Pattern_Currency;
            }
            var result = String.Format(CulCurrency, f, d);
            if (formatMinus)
            {
                if (d < 0)
                {
                    result = $"({result})";
                }
            }
            return result;
        }

        public static string FormatDateTime(DateTime? d, string format)
        {
            if (d == null)
                return "";
            else
                return d.Value.ToString(format);
        }

        public static string FormatDateTime(DateTime? d)
        {
            if (d == null)
                return "";
            else
                return d.Value.ToString(CultureSystem.Pattern_ShortDate);
        }

       

        //public static bool ConvertTextToDateTime(string text, out DateTime result)
        //{
        //    string format = CultureSystem.Pattern_ShortDate;
        //    if (string.IsNullOrEmpty(format)) format = "yyyy-MM-dd";
        //    return DateTime.TryParseExact(text, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out result);
        //}

        //public static DateTime? TextToDateTime(string text)
        //{
        //    DateTime? result = null;
        //    bool canConvert = ConvertTextToDateTime(text, out DateTime date);
        //    if (canConvert) result = date;
        //    return result;
        //}

      

        public static string FormatString_MoneyInDollar(decimal money)
        {
            if (money == 0) return "$0";
            return string.Format("${0:#,###}", money);
        }
        public static string FormatString_MoneyInDollar(decimal? percent)
        {
            string sText = string.Empty;
            if (percent == null)
            {
                sText = "Null";
            }
            else
            {
                sText = FormatString_MoneyInDollar(percent.Value);
            }
            return sText;
        }
        public static string FormatString_Percent(decimal percent)
        {
            if (percent == 0) return "0%";
            return string.Format("{0:#.##}%", percent);
        }
        public static string FormatString_Percent(decimal? percent)
        {
            string sText = string.Empty;
            if (percent == null)
            {
                sText = "Null";
            }
            else
            {
                sText = FormatString_Percent(percent.Value);
            }
            return sText;
        }
        public static string ConvertToString(object value, string formatCultureInfo, PropertyInfo fieldPro)
        {
            string result = value.ToString();
            string sType = string.Empty;
            if (fieldPro != null)
            {
                var type = Nullable.GetUnderlyingType(fieldPro.PropertyType) ?? fieldPro.PropertyType;
                sType = type.Name;
            }
            string decAndDouFormat = "{0:N2}", intFormat = "{0:N0}";
            if (string.IsNullOrEmpty(formatCultureInfo))
            {
            }
            else
            {
                decAndDouFormat = intFormat = formatCultureInfo;
            }
            if (sType.Contains("Decimal"))
                result = string.Format(new CultureInfo("en-AU"), decAndDouFormat, value);
            else if (sType.Contains("Double"))
                result = string.Format(new CultureInfo("en-AU"), decAndDouFormat, value);
            else if (sType.Contains("Int"))
                result = string.Format(new CultureInfo("en-AU"), intFormat, value);
            return result;
        }
    }

    public class CultureItemInfo
    {
        /// <summary>
        /// vi-VN, en-EN
        /// </summary>
        public string CultureName { get; set; }

        public string Pattern_Currency { get; set; }

        public string Pattern_Number { get; set; }

        public string Pattern_LongDateTime { get; set; }

        public string Pattern_ShortDateTime { get; set; }

        public string Pattern_LongDate { get; set; }

        public string Pattern_ShortDate { get; set; }

        public string Pattern_LongTime { get; set; }

        public string Pattern_ShortTime { get; set; }
    }
}