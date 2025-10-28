using Ezy.Module.BaseData.Models;
using Ezy.Module.BaseService.Services;
using Ezy.Module.Controller.Controllers;
using Ezy.Module.Library.Message;
using Ezy.Module.Library.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;

namespace SourceAPI.Controllers
{
    /// <summary>
    ///
    /// </summary>
    public class LogExceptionModel : EzyBaseModel
    {
        public object Data { get; set; }
    }

    /// <summary>
    ///
    /// </summary>
    [Route("api/v1/Exception")]
    public class ExceptionController : BaseEzyServiceController<ILogExceptionService>
    {
        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [Route("Save")]
        [HttpPost]
        [Authorize]
        public EzyResultObject<string> SetHandel(LogExceptionModel model)
        {
            var result = DoJob<string>(model, () =>
            {
                string sResult = "";
                if (model == null || model.Data == null)
                {
                    sResult = "InvalidData";
                }
                return sResult;
            }, (rs) =>
            {
                string sIpAddress = GetRemoteIpAddress();
                string sResult = "";
                string sData = model.Data == null ? string.Empty : JsonHelper.SerializeObject(model.Data);
                sResult = _service.SaveException(new Exception(sData), "ExceptionController-SaveLog", sIpAddress);
                return sResult;
            }, Message_UpdateSuccess);

            return result;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [Route("Save")]
        [HttpPost]
        [Authorize]
        public EzyResultObject<string> SaveLog(LogExceptionModel model)
        {
            var result = DoJob<string>(model, () =>
            {
                string sResult = "";
                if (model == null || model.Data == null)
                {
                    sResult = "InvalidData";
                }
                return sResult;
            }, (rs) =>
            {
                string sIpAddress = GetRemoteIpAddress();
                string sResult = "";
                string sData = model.Data == null ? string.Empty : JsonHelper.SerializeObject(model.Data);
                sResult = _service.SaveException(new Exception(sData), "ExceptionController-SaveLog", sIpAddress);
                return sResult;
            }, Message_UpdateSuccess);

            return result;
        }

        [Route("SaveLog")]
        [HttpPost]
        public EzyResultObject<string> SaveLog(object model)
        {
            string sData = string.Empty;
            var result = DoJob<string>(model, () =>
            {
                string sResult = "";
                if (model == null)
                {
                    sResult = "InvalidData";
                }
                else
                {
                    sData = JsonHelper.SerializeObject(model);
                    var dic = DictionaryHelper.ParseDic(sData);
                    string[] sKeys = new string[] { "LogBy", "AIPUrl", "Url", "Error", "Data" };
                    bool isInvalid = false;
                    foreach (var sKey in sKeys)
                    {
                        if (!dic.ContainsKey(sKey))
                        {
                            isInvalid = true;
                            break;
                        }
                    }
                    if (isInvalid == true)
                    {
                        sResult = "InvalidData";
                    }
                }
                return sResult;
            }, (rs) =>
            {
                string sIpAddress = GetRemoteIpAddress();

                string sResult = "";
                if (string.IsNullOrEmpty(sData))
                {
                    sData = JsonHelper.SerializeObject(model);
                }
                sResult = _service.SaveException(new System.Exception(sData), "ExceptionController-SaveLog", sIpAddress);

                return sResult;
            }, Message_UpdateSuccess);

            return result;
        }
    }
}
