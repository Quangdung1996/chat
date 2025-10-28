using Ezy.APIService.Core.Services;
using Ezy.Module.Library.Utilities;
using System;
using System.Linq;

namespace SourceAPI.Core.Utilities
{
    public class SourceEzyDateTimeHelper
    {
        private static double? _sqlStoreTimeZoneHours;

        public static double sqlStoreTimeZoneHours
        {
            get
            {
                var _hours = _sqlStoreTimeZoneHours;
                if (_hours == null)
                {
                    _hours = SystemConfigHelper.GetValueFromConfig_double("SERVER_TIME_ZONE_HOURS", 7.0d);
                    if (_hours != 0)
                    {
                        _sqlStoreTimeZoneHours = _hours;
                    }
                }
                return _sqlStoreTimeZoneHours ?? 0;
            }
        }

        public static DateTime? DateTime_FromClientToServer_SQL(double? dMiliSeconds)
        {
            DateTime? dateTime = null;
            if (dMiliSeconds != null)
            {
                dateTime = EzyBaseDateTimeHelper.ConvertToDateTimeFromUnixTime(dMiliSeconds ?? 0);
                if (dateTime != null)
                {
                    var _hours = sqlStoreTimeZoneHours;
                    if (_hours > 0)
                    {
                        dateTime = dateTime.Value.AddHours(_hours);
                    }
                }
                if (dateTime != null)
                {
                    var newTime = new DateTime(
                      dateTime.Value.Year,
                      dateTime.Value.Month,
                      dateTime.Value.Day,
                      dateTime.Value.Hour,
                      dateTime.Value.Minute,
                      dateTime.Value.Second,
                      dateTime.Value.Millisecond
                      );
                    dateTime = newTime;// remove kind = uct
                }
            }
            return dateTime;
        }

        public static DateTime? DateTime_FromClientToServer_SQL(object oMiliSeconds)
        {
            DateTime? dateTime = null;
            string sMiliSeconds = oMiliSeconds == null ? "" : oMiliSeconds.ToString();
            double? dMiliSeconds = Double_TryPase(sMiliSeconds);

            if (dMiliSeconds > 0)
            {
                dateTime = DateTime_FromClientToServer_SQL(dMiliSeconds);
            }

            return dateTime;
        }

        public static double? DateTime_FromServerToClient(DateTime? dateTime)
        {
            double? resutl = null;

            if (dateTime != null)//&& dateTime.Value.Year > DateTimeHelper.Date_UnixTime_UTC_Begin.Year
            {
                var _hours = sqlStoreTimeZoneHours;
                if (_hours > 0)
                {
                    //TimeZoneInfo tZone = TimeZoneInfo.Local;
                    //TimeZoneInfo.GetSystemTimeZones();
                    //dateTime = TimeZoneInfo.ConvertTimeFromUtc()
                }
                resutl = EzyBaseDateTimeHelper.DateTimeToUnixTimestamp(dateTime);
            }
            if (resutl == 0)
            {
                resutl = null;
            }
            return resutl;
        }

        public static double? Double_TryPase(string sValue)
        {
            double? dresult = null;
            if (!string.IsNullOrEmpty(sValue))
            {
                double dMiliSeconds = 0;
                if (double.TryParse(sValue, out dMiliSeconds))
                {
                    dresult = dMiliSeconds;
                }
            }
            return dresult;
        }

        public static DateTime? DateTime_ReportRefine_From(DateTime? date)
        {
            if (date != null)
            {
                date = date.Value.Date;
            }
            return date;
        }

        public static DateTime? DateTime_ReportRefine_To(DateTime? date)
        {
            if (date != null)
            {
                if (date == date.Value.Date)
                    date = date.Value.Date.AddDays(1).AddSeconds(-1);
                if (date.Value.Millisecond > 0)
                {
                    /// thong thuong chi xai HH:mm:ss. Ko su dung Millisecond.
                    /// O SQL :EF core khi truyen tu code xuong store: neu la 23:59:59:999 => no se chuyen sang ngay moi. Nguy hiem
                    var mili = -date.Value.Millisecond;
                    date = date.Value.AddMilliseconds(mili);
                }
            }
            return date;
        }
    }

    public class EzyMathHelper
    {
        public static decimal? GetAverage(decimal?[] values)
        {
            decimal? dResult = null;
            var hasValues = values == null ? null : values.Where(c => c > 0).ToArray();
            if (hasValues != null && hasValues.Length > 0)
            {
                dResult = hasValues.Sum(c => c) / hasValues.Length;
            }
            return dResult;
        }

        public static decimal? GetAverage_AndRound(decimal?[] values)
        {
            decimal? dResult = GetAverage(values);

            if (dResult > 0)
            {
                dResult = Math.Round((dResult.Value), 1);
            }
            return dResult;
        }

        public static decimal? DecimalRound1(decimal? dValue)
        {
            if (dValue > 0)
            {
                dValue = Math.Round((dValue.Value), 1);
            }
            return dValue;
        }
    }
}
