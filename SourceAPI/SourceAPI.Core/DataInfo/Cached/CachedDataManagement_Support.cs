using Ezy.APIService.Core.Cache;
using Ezy.APIService.Core.DataInfo;
using Ezy.Module.BaseService.FrameWork;
using Ezy.Module.Library.Data;
using Ezy.Module.Library.Utilities;
using SourceAPI.Core.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace SourceAPI.Core.DataInfo.Cached
{
    public partial class CachedDataManagement : CoreEzyMemoryCache
    {
        private static Dictionary<string, Action> SystemConfigs_Refresh_ListAction { get; set; }
        public static BaseCategoryIDNameCodeInfo[] GetBaseCategoryList(string sPropertyName)
        {
            BaseCategoryIDNameCodeInfo[] data = GetBaseCategoryList<BaseCategoryIDNameCodeInfo>(sPropertyName);
            return data;
        }
        public static void SystemConfigs_Refresh_AddAction(string key, Action act)
        {
            if (SystemConfigs_Refresh_ListAction == null)
                SystemConfigs_Refresh_ListAction = new Dictionary<string, Action>();
            if (!SystemConfigs_Refresh_ListAction.ContainsKey(key))
            {
                SystemConfigs_Refresh_ListAction.Add(key, act);
            }
            else
            {
                throw new Exception($"SystemConfigs_Refresh_AddAction. Key [{key}] was called 2 times with key");
            }
        }

        private static Dictionary<string, SolidStaffInfo> Staff_Dic_StaffCode
        {
            get
            {
                var staffList = CachedDataManagement.Staffs_All.Where(t => !string.IsNullOrEmpty(t.StaffCode));
                var dic = DictionaryHelper.BuildDictionaryFast(staffList, t => t.StaffCode);
                return dic;
            }
        }

        public static SolidStaffInfo Staff_Get_Instance_StaffCode(string staffCode)
        {
            SolidStaffInfo item = null;
            if (!string.IsNullOrEmpty(staffCode) && Staff_Dic_StaffCode != null)
            {
                if (Staff_Dic_StaffCode.ContainsKey(staffCode))
                    item = Staff_Dic_StaffCode[staffCode];
            }
            return item;
        }

        public static string Department_Get_Instance_Name(object Id)
        {
            string name = string.Empty;
            var dep = CachedDataManagement.Department_Get_Instance_Id(Id);
            if (dep != null)
                name = dep.Name;
            return name;
        }

        private static IDataCachedService _IDataCachedService_Private = null;

        public static IDataCachedService _IDataCachedService
        {
            get
            {
                if (_IDataCachedService_Private == null)
                    _IDataCachedService_Private = EzyFrameWorkManagement.CreateInstance<IDataCachedService>();
                return _IDataCachedService_Private;
            }
        }

        private static Dictionary<string, PropertyInfo> _Dic_CachedProperties = null;

        public static Dictionary<string, PropertyInfo> Dic_CachedProperties
        {
            get
            {
                if (_Dic_CachedProperties == null)
                {
                    _Dic_CachedProperties = typeof(CachedDataManagement).GetProperties().ToDictionary(c => c.Name);
                }
                return _Dic_CachedProperties;
            }
        }

        /// <summary>
        /// muon lay funder -> sPropertyName=ConfigFunders
        ///vi minh khai bao  public static ConfigFunderInfo[] ConfigFunders
        /// </summary>
        /// <param name="sPropertyName"></param>
        /// <returns></returns>
        public static BaseCategoryItem[] GetBaseCategoryItemList(string sPropertyName)
        {
            BaseCategoryItem[] data = GetBaseCategoryList<BaseCategoryItem>(sPropertyName);
            return data;
        }

        /// <summary>
        /// muon lay funder -> sPropertyName=ConfigFunders
        ///vi minh khai bao  public static ConfigFunderInfo[] ConfigFunders
        /// </summary>
        /// <param name="sPropertyName"></param>
        /// <returns></returns>
        public static TCategory[] GetBaseCategoryList<TCategory>(string sPropertyName) where TCategory : class, new()
        {
            TCategory[] data = Array.Empty<TCategory>();
            var property = DictionaryHelper.GetValue_Dic(Dic_CachedProperties, sPropertyName);
            if (property != null)
            {
                var oData = property.GetValue(null, null);
                if (oData != null)
                {
                    data = oData as TCategory[];
                }
                if (data == null)
                {
                    data = Array.Empty<TCategory>();
                }
            }
            return data;
        }

        public static BaseCategoryItem[] CreatePercentConfig(int startValue, int inter, int maxValue)
        {
            List<BaseCategoryItem> listValues = new();
            var minValue = startValue;
            var iLoop = ((maxValue - minValue) / inter) + 1;
            for (int i = 0; i < iLoop; i++)
            {
                var value = minValue + (i * inter);
                BaseCategoryItem item = new() { Value = value.ToString(), Text = string.Format("{0}%", value) };
                listValues.Add(item);
            }
            return listValues.ToArray();
        }
        public static SolidStaffInfo Userlogin_GetSystemUser()
        {
            var staff = UserLogins.Where(c => c.Username != null && c.Username.Equals("administrator", StringComparison.InvariantCultureIgnoreCase))
                .FirstOrDefault();
            if (staff == null)
            {
                staff = UserLogins.Where(c => c.IsAdmin == true).OrderBy(c => c.Id).FirstOrDefault();
            }
            return staff;
        }
    }
}
