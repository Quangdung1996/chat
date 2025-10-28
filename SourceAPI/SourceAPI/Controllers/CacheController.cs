using Ezy.APIService.AppSystemService.Models;
using Ezy.APIService.Shared.Helper;
using Ezy.APIService.Shared.Models;
using Ezy.Module.Controller.Controllers;
using Ezy.Module.Library.Message;
using Ezy.Module.Library.Utilities;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using Ezy.Module.BaseService.FrameWork;

namespace SourceAPI.Controllers
{
    public class RefreshCacheModel
    {
        public string Id { get; set; }
        public string Password { get; set; }
    }

    /// <summary>
    ///
    /// </summary>
    [Route("api/v1/Cache")]
    public class CacheController : BaseApiController
    {
        /// <summary>
        ///
        /// </summary>
        public CacheController()
        {
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [Route("Refresh")]
        [HttpPost]
        public EzyResultObject<string> Refresh(RefreshCacheModel model)
        {
            var result = DoJob<string>(model, null, (rs) =>
             {
                 string sResult = "";
                 if (string.IsNullOrEmpty(model.Id))
                 {
                     sResult = "Please select a item.";
                 }
                 else
                 {
                     sResult = DataCacheHelper.RefreshCache(model.Id);
                 }
                 rs.Msg = sResult;
                 return sResult;
             }, Message_Success);

            return result;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [Route("GetCache")]
        [HttpPost]
        public EzyResultObject<object> GetCache(RefreshCacheModel model)
        {
            var result = DoJob<object>(model, null, (rs) =>
             {
                 object sResult = "";
                 if (string.IsNullOrEmpty(model.Id))
                 {
                     sResult = "Please select a item.";
                 }
                 else
                 {
                     sResult = DataCacheHelper.GetCache(model.Id);
                 }
                 rs.Msg = "";
                 return sResult;
             });

            return result;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [Route("CreatePasswordHash")]
        [HttpPost]
        public EzyResultObject<object> Test2(RefreshCacheModel model)
        {
            var result = DoJob<object>(model, null, (rs) =>
            {
                var passHashed = SecurityHelper.CreatePasswordHash(model.Password);
                return passHashed;
            });

            return result;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [Route("GetVer")]
        [HttpPost]
        public EzyResultObject<object> GetVer(RefreshCacheModel model)
        {
            var result = DoJob<object>(model, null, (rs) =>
            {
                var sVer = "22.03.03.01";
                return sVer;
            });
            return result;
        }

        [HttpGet]
        [Route("GetFolder")]
        public object GetFolder()
        {
            Dictionary<string, string> dicResult = new Dictionary<string, string>();
            var curr01 = System.IO.Directory.GetCurrentDirectory();
            dicResult.Add("GetCurrentDirectory", curr01);
            var curr02 = AppDomain.CurrentDomain.BaseDirectory;
            dicResult.Add("CurrentDomain.BaseDirectory", curr02);

            var path1 = System.IO.Path.Combine(curr02, "Upload", "1");
            dicResult.Add("Path01_BaseDirectory", path1);

            var path2 = System.IO.Path.Combine(curr01, path1);
            dicResult.Add("Path02_Extend_Path01", path2);

            var path3 = System.IO.Path.Combine(curr01, "Upload", "1");
            dicResult.Add("Path03_CurrentDirectory", path3);

            return dicResult;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        [NonAction]
        private EzyLoginUserInfo GetUserInfo(UserProfileInfo user)
        {
            string sUserName = user.Username;
            if (string.IsNullOrEmpty(sUserName))
            {
                sUserName = user.DisplayName;
            }
            if (string.IsNullOrEmpty(sUserName))
            {
                sUserName = user.Id;
            }

            //  var config = UserSettingHelper.GetURLConfigs(user.Id);
            var _user = new EzyLoginUserInfo()
            {
                user_name = user.Username,
                user_id = user.Id,
                name = user.DisplayName,
                avatar_url = user.ProfilePicturePath ?? "",
                user_mobile = user.PhoneNumber ?? "",
                user_type = user.UserType ?? "",
                user_uniqueid = user.UniqueId,
                fa2_needverify = user.FA2Enabled ?? false,
                fa2_needenable = user.FA2ForceToEnabled ?? false
            };
            return _user;
        }
    }
}