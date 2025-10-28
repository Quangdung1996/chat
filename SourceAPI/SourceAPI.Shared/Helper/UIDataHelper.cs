using Ezy.ApiService.ReleaseService.Helper;
using Ezy.APIService.Core.DataInfo;
using Ezy.APIService.Shared.Helper;
using Ezy.Module.BaseData.Interfaces;
using Ezy.Module.Library.Data;
using Ezy.Module.Library.Utilities;
using SourceAPI.Core.Data;
using SourceAPI.Core.DataInfo.Cached;
using SourceAPI.Shared.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace SourceAPI.Shared.Helper
{
    public class ResultCheckFormAPIModel
    {
        public ConfigFormAPI Config { get; set; }
    }
    public class ConfigFormAPI
    {
        public bool IsShow { get; set; }
        public string Title { get; set; }
        public object RequestData { get; set; }
        public object FormData { get; set; }
        public object ResultModel { get; set; }
    }
    public class ConfigOptionSourceListItem
    {
        public string Type { get; set; }

        public object Source { get; set; }
    }

    public class UIDataHelper : EzyUIDataHelper
    {
        public static OptionItemModel[] GetListOptions_API_IdName<T>(IEnumerable<T> data)
            where T : class, IEzyIdAndNameEntity, new()
        {
            OptionItemModel[] result = null;
            if (data != null && data.Count() > 0)
            {
                result = data.Select(c => new OptionItemModel()
                {
                    Text = c.Name,
                    Value = c.Id.ToString()
                }).ToArray();
            }
            return result;
        }
        public static OptionItemModel[] GetListOptions_API<T>(IEnumerable<T> data, Func<T, string> fGetValue, Func<T, string> fGetText)
        {
            OptionItemModel[] result = null;
            if (data != null && data.Count() > 0)
            {
                result = data.Select(c => new OptionItemModel()
                {
                    Text = fGetText(c),
                    Value = fGetValue(c)
                }).ToArray();
            }
            return result;
        }
        public static BaseCategoryItem[] GetListOptions_Simple(string sConfigSourceList, bool isHasNullValue = false)
        {
            #region Log method version
            MethodBase.GetCurrentMethod().LogMethodVersion("20221013-0715", "Đem màn hinh config từ DEB EZY qua",
                "https://allianceitscvn2.atlassian.net/browse/JET-11");
            #endregion Log method version 
            BaseCategoryItem[] optList = new BaseCategoryItem[0];
            if (!string.IsNullOrEmpty(sConfigSourceList))
            {
                var cfItem = JsonHelper.DeserializeObject<ConfigOptionSourceListItem>(sConfigSourceList);
                if (cfItem != null && cfItem.Source != null)
                {
                    if (cfItem.Type == "Fixed")
                    {
                        var sDataSource = JsonHelper.SerializeObject(cfItem.Source);
                        optList = JsonHelper.DeserializeObject<BaseCategoryItem[]>(sDataSource);
                    }
                    else if (cfItem.Type == "Cache_CodeName")
                    {
                        var cachedData = CachedDataManagement.GetBaseCategoryList(cfItem.Source.ToString());
                        cachedData = cachedData?.Where(c => !string.IsNullOrEmpty(c.Code)).ToArray();
                        if (cachedData != null && cachedData.Length > 0)
                        {
                            optList = GetListOptions_CodeName(cachedData.Where(c => !c.IsDisable));
                        }
                    }
                    else if (cfItem.Type == "Cache_Fixed")
                    {
                        var cachedData = CachedDataManagement.GetBaseCategoryItemList(cfItem.Source.ToString());
                        if (cachedData != null && cachedData.Length > 0)
                        {
                            optList = cachedData;
                        }
                    }
                    else
                    {
                        var cachedData = CachedDataManagement.GetBaseCategoryList(cfItem.Source.ToString());
                        if (cachedData != null && cachedData.Length > 0)
                        {
                            optList = GetListOptions_IdName(cachedData.Where(c => !c.IsDisable));
                        }
                    }
                }
                if (isHasNullValue && optList != null && optList.Any())
                {
                    var value = optList.FirstOrDefault(c => c.Value != null && c.Value.Equals("null", StringComparison.OrdinalIgnoreCase));
                    if (value == null)
                    {
                        List<BaseCategoryItem> temp = new();
                        temp.Add(new()
                        {
                            Text = "null",
                            Value = "null"
                        });
                        temp.AddRange(optList);
                        optList = temp.ToArray();
                    }
                }
            }

            return optList;
        }
    }
}