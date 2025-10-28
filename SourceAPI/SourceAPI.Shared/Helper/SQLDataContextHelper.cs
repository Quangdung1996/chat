using Ezy.APIService.Core.DataInfo;
using Ezy.APIService.CoreUtilities.Utilities;
using Ezy.APIService.Shared.Helper;
using Ezy.Module.Library.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace SourceAPI.Shared.Helper
{
    public class ObjectHelper
    {
        public static bool CopyPropertiesIgnoreNull(object tSou, object tDes)
        {
            return CopyPropertiesIgnoreNull(tSou, tDes, false, null, null);
        }
        public static bool CopyPropertiesIgnoreNull(object tSou, object tDes, string[] fieldNames)
        {
            return CopyPropertiesIgnoreNull(tSou, tDes, false, fieldNames, null);
        }

        public static bool CopyPropertiesIgnoreNull(object tSou, object tDes, bool needCheckChange, string[] fieldNames, string[] ignoredFieldNames)
        {
            return CopyPropertiesIgnoreNull(tSou, tDes, false, needCheckChange, fieldNames, ignoredFieldNames);
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="tSou">OBJ SOURCE</param>
        /// <param name="tDes">OBJ DESC</param>
        /// <param name="IsIncludeIMProperties">copy Id and Log properties</param>
        /// <param name="fieldNames">Only copy this fields</param>
        /// <param name="ignoredFieldNames">ignore this fields</param>
        /// <returns></returns>
        public static bool CopyPropertiesIgnoreNull(object tSou, object tDes, bool IsIncludeIMProperties, bool needCheckChange, string[] fieldNames, string[] ignoredFieldNames)
        {
            bool hasChange = false;
            if (tSou == null || tDes == null)
                return hasChange;

            Type typeSou = tSou.GetType();
            PropertyInfo[] propS = null;

            propS = typeSou.GetProperties().Where(c => (c.CanRead == true) && (c.PropertyType.IsValueType == true || typeof(string).IsAssignableFrom(c.PropertyType))).ToArray();

            Type typeDes = tDes.GetType();
            PropertyInfo[] propDs = null;

            propDs = typeDes.GetProperties().Where(c => c.CanRead == true && c.CanWrite == true && (c.PropertyType.IsValueType == true || typeof(string).IsAssignableFrom(c.PropertyType))).ToArray();

            var fieldNamesSource = propS.Select(c => c.Name).ToArray();
            if (IsIncludeIMProperties == false)
            {
                fieldNamesSource = fieldNamesSource.Where(c => c != "Id" && !c.StartsWith("IM_")).ToArray();
            }
            if (fieldNames != null && fieldNames.Length > 0)
            {
                fieldNamesSource = fieldNamesSource.Where(c => fieldNames.Contains(c)).ToArray();
            }
            if (ignoredFieldNames != null && ignoredFieldNames.Length > 0)
            {
                fieldNamesSource = fieldNamesSource.Where(c => !ignoredFieldNames.Contains(c)).ToArray();
            }
            propDs = propDs.Where(c => fieldNamesSource.Contains(c.Name)).ToArray();
            if (propDs == null || propDs.Length == 0)
                return hasChange;
            foreach (var pD in propDs)
            {
                var pDType = Nullable.GetUnderlyingType(pD.PropertyType) ?? pD.PropertyType;
                //var pDType = pD.PropertyType;
                if (pD.PropertyType.IsValueType || typeof(string).IsAssignableFrom(pD.PropertyType))
                {
                    var ps = propS.FirstOrDefault(c => c.Name == pD.Name);
                    Type psType = Nullable.GetUnderlyingType(ps.PropertyType) ?? ps.PropertyType;
                    //Type psType =  ps.PropertyType;
                    if (ps == null)
                    {
                        continue;
                    }
                    if (pDType.Name == psType.Name)
                    {
                        var valueS = ps.GetValue(tSou, null);
                        var bChange = SetValueToProperty(tSou, tDes, pD, valueS, needCheckChange);
                        if (bChange == true)
                        {
                            hasChange = true;
                        }
                    }
                    else if (pDType == typeof(long?) && psType == typeof(string))
                    {
                        var oValueS = ps.GetValue(tSou, null);
                        var valueS = SQLDataContextHelper.ConvertStringToPKId(oValueS == null ? string.Empty : oValueS.ToString());
                        var bChange = SetValueToProperty(tSou, tDes, pD, valueS, needCheckChange);
                        if (bChange == true)
                        {
                            hasChange = true;
                        }
                    }
                    else if (pDType == typeof(long) && psType == typeof(string))
                    {
                        var oValueS = ps.GetValue(tSou, null);
                        var valueS = SQLDataContextHelper.ConvertStringToPKId(oValueS == null ? string.Empty : oValueS.ToString());
                        var bChange = SetValueToProperty(tSou, tDes, pD, valueS, needCheckChange);
                        if (bChange == true)
                        {
                            hasChange = true;
                        }
                    }
                    else if (pDType == typeof(Guid) && psType == typeof(string))
                    {
                        var oValueS = ps.GetValue(tSou, null);
                        var valueS = SQLDataContextHelper.ConvertStringToGUId(oValueS == null ? string.Empty : oValueS.ToString());
                        var bChange = SetValueToProperty(tSou, tDes, pD, valueS, needCheckChange);
                        if (bChange == true)
                        {
                            hasChange = true;
                        }
                    }
                    else if (pDType == typeof(string) && (psType == typeof(Guid) || psType == typeof(long?) || psType == typeof(long)))
                    {
                        var oValueS = ps.GetValue(tSou, null);
                        var valueS = SQLDataContextHelper.ConvertToStringId(oValueS);
                        var bChange = SetValueToProperty(tSou, tDes, pD, valueS, needCheckChange);
                        if (bChange == true)
                        {
                            hasChange = true;
                        }
                    }
                    else if (pDType == typeof(DateTime?) && (psType == typeof(double?) || psType == typeof(double)))
                    {
                        var oValueS = ps.GetValue(tSou, null);
                        var valueS = DateTime_ToServer(oValueS);
                        var bChange = SetValueToProperty(tSou, tDes, pD, valueS, needCheckChange);
                        if (bChange == true)
                        {
                            hasChange = true;
                        }
                    }
                    else if (pDType == typeof(DateTime) && (psType == typeof(double?) || psType == typeof(double)))
                    {
                        var oValueS = ps.GetValue(tSou, null);
                        var valueS = DateTime_ToServer(oValueS);

                        var bChange = SetValueToProperty(tSou, tDes, pD, valueS, needCheckChange);
                        if (bChange == true)
                        {
                            hasChange = true;
                        }

                    }
                    else if (pDType == typeof(double?) && (psType == typeof(DateTime?) || psType == typeof(DateTime)))
                    {
                        var oValueS = ps.GetValue(tSou, null);
                        var dValueS = oValueS as DateTime?;
                        var valueS = DateTime_ToClient(dValueS);
                        var bChange = SetValueToProperty(tSou, tDes, pD, valueS, needCheckChange);
                        if (bChange == true)
                        {
                            hasChange = true;
                        }
                    }
                    else if ((pDType == typeof(DateTime) || pDType == typeof(DateTime?)) && psType == typeof(string))
                    {
                        var oValueS = ps.GetValue(tSou, null);
                        var valueS = GeneralHelper.DateOnly_ToServer((string)oValueS);

                        var bChange = SetValueToProperty(tSou, tDes, pD, valueS, needCheckChange);
                        if (bChange == true)
                        {
                            hasChange = true;
                        }
                    }
                }
            }
            return hasChange;
        }

        private static bool SetValueToProperty(object tSou, object tDes, PropertyInfo pD, object valueS, bool needCheckChange)
        {
            bool hasChange = false;
            bool isEqual = false;
            if (needCheckChange == true)
            {
                var valueDes = pD.GetValue(tDes, null);
                isEqual = Object_Equal(valueS, valueDes);
            }
            if (!isEqual)//valueS != null &&
            {
                pD.SetValue(tDes, valueS, null);
                hasChange = true;
            }
            return hasChange;
        }

        public static bool Object_Equal(object a, object b)
        {
            bool isEqual = false;
            if (a == null && b == null)
            {
                isEqual = true;
            }
            else if (a != null && b != null && a.Equals(b))
            {
                isEqual = true;
            }
            return isEqual;
        }
        public static DateTime? DateTime_ToServer(object oMiliSeconds)
        {
            var d = EzyClientUtilityManager.DateTime_FromClientToServer_SQL(oMiliSeconds);
            return d;
        }
        public static double? DateTime_ToClient(DateTime? date)
        {
            var d = EzyClientUtilityManager.DateTime_FromServerToClient(date);
            return d;
        }
    }

    public class SQLDataContextHelper : EzySQLDataContextHelper
    {
        public static void Register()
        {
            Func_RefineEntityByConfig = ConfigRefineEntity;
        }
        public static DateTime? DateTime_FromClientToServer_SQL_ReportRefine_To(double? dMiliSeconds)
        {
            DateTime? dateTime = EzyDateTimeHelper.DateTime_FromClientToServer_SQL(dMiliSeconds);
            dateTime = DateTime_ReportRefine_To(dateTime);
            return dateTime;
        }
        public static DateTime? DateTime_ReportRefine_To(DateTime? date)
        {
            if (date != null)
            {
                if (date == date.Value.Date)
                    date = date.Value.Date.AddDays(1).AddSeconds(-1);
            }
            return date;
        }
        public static string ConfigRefineEntity<T>(T t) where T : class
        {
            string sMessage = "";
            return sMessage;
        }

        public static string GetAvatarUrl(SolidStaffInfo staff)
        {
            var profilePicturePath = staff.ProfilePicturePath;
            string result;
            var displayName = staff.IM_DisplayName;
            if (string.IsNullOrEmpty(profilePicturePath) && !string.IsNullOrEmpty(displayName))
            {
                char f = displayName.ToUpper().FirstOrDefault();
                profilePicturePath = EzyIOHelper.PathCombine(AppDomain.CurrentDomain.BaseDirectory, $"Avatar/{f}.png");
                result = EzyPictureHelper.GetFullUrl_Server(profilePicturePath);
            }
            else result = EzyPictureHelper.GetFullUrlThumbnail(profilePicturePath);
            return result;
        }
    }


    public class StringPatternHelper_V2
    {
        public static string[] GetPatterPropertyNames(string sPatter)
        {
            if (!string.IsNullOrEmpty(sPatter))
            {
                //var sArrays = Regex.Split(sPatter, @"\[[^\]]+\]");

                // return sPatter.Split(' ').Where(c => c != "" && ((c.StartsWith("[") && c.EndsWith("]")) || (c.StartsWith("{") && c.EndsWith("}")))).ToArray();

                List<string> sResult = new List<string>();
                System.Text.RegularExpressions.Regex r = new System.Text.RegularExpressions.Regex(@"(\[[^\]]+\])");
                System.Text.RegularExpressions.MatchCollection mc = r.Matches(sPatter);
                if (mc != null)
                {
                    var _count = mc.Count;
                    for (int i = 0; i < _count; i++)
                    {
                        var a = mc[i].Groups[0].Value;
                        sResult.Add(a);
                    }
                }


                return sResult.ToArray();
            }
            return null;
        }
        public static string GetFieldNameFromPatter(string sPatterFieldName)
        {
            string sResult = sPatterFieldName.TrimStart(' ', '[', '{');
            sResult = sResult.TrimEnd(' ', ']', '}');
            sResult = sResult.Trim();
            return sResult;
        }
        public static string ReplacePattern<T>(T entity, string sMessage)
        {
            Dictionary<string, System.Reflection.PropertyInfo> properties_Dic = typeof(T).GetProperties().ToDictionary(f => f.Name);
            string sResult = sMessage;
            if (string.IsNullOrEmpty(sResult))
            {
                return sResult;
            }
            if (entity == null)
            {
                return sResult;
            }
            var fieldNamesPattern = StringPatternHelper_V2.GetPatterPropertyNames(sResult);
            if (fieldNamesPattern != null && fieldNamesPattern.Length > 0)
            {
                foreach (var sP in fieldNamesPattern)
                {
                    string sFieldName = StringPatternHelper_V2.GetFieldNameFromPatter(sP);
                    if (sFieldName == "Today")
                    {
                        //sResult = sResult.Replace(sP, DateTime.Now.ToString("dd/MM/yyyy"));
                        sResult = sResult.Replace(sP, DateTime.Now.ToString(FormatHelper.DateDisplay_dd_Slash_MM_Slash_yyyy));
                    }
                    else
                    {
                        var p = properties_Dic.ContainsKey(sFieldName) ? properties_Dic[sFieldName] : null;
                        if (p != null)
                        {
                            var _value = p.GetValue(entity);
                            var typeOfP = p.PropertyType;
                            string sNewV = _value == null ? string.Empty : _value.ToString();
                            if (_value != null && (typeOfP == typeof(DateTime) || typeOfP == typeof(DateTime?)))
                            {
                                DateTime date = (DateTime)_value;
                                //sNewV = date.ToString("dd/MM/yyyy");
                                sNewV = date.ToString(FormatHelper.DateDisplay_dd_Slash_MM_Slash_yyyy);
                            }

                            //if (CategoryDataCached.Dic_PropertyName_FuncGetName != null && CategoryDataCached.Dic_PropertyName_FuncGetName.ContainsKey(sFieldName))
                            //{
                            //    sNewV = CategoryDataCached.GetConfigNameByStringId(sFieldName, sNewV);

                            //}
                            sResult = sResult.Replace(sP, sNewV);
                        }
                    }
                }
            }
            return sResult;
        }

        public static string ReplacePattern(Dictionary<string, object> dic_Key_Value, string sMessage)
        {

            string sResult = sMessage;
            if (dic_Key_Value == null)
            {
                return sResult;
            }
            if (string.IsNullOrEmpty(sResult))
            {
                return sResult;
            }
            var fieldNamesPattern = StringPatternHelper_V2.GetPatterPropertyNames(sResult);
            if (fieldNamesPattern != null && fieldNamesPattern.Length > 0)
            {
                foreach (var sP in fieldNamesPattern)
                {
                    string sFieldName = StringPatternHelper_V2.GetFieldNameFromPatter(sP);
                    if (sFieldName == "Today")
                    {
                        //sResult = sResult.Replace(sP, DateTime.Now.ToString("dd/MM/yyyy"));
                        sResult = sResult.Replace(sP, DateTime.Now.ToString(FormatHelper.DateDisplay_dd_Slash_MM_Slash_yyyy));
                    }
                    else
                    {
                        var _value = dic_Key_Value.ContainsKey(sFieldName) ? dic_Key_Value[sFieldName] : null;
                        if (_value != null)
                        {

                            string sNewV = _value == null ? string.Empty : _value.ToString();
                            sResult = sResult.Replace(sP, sNewV);
                        }
                    }
                }
            }
            return sResult;
        }        
    }
}