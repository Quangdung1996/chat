using Ezy.APIService.Core.Repository;
using Ezy.Module.Library.Utilities;
using Ezy.Module.MSSQLRepository.Repository;
using SourceAPI.Core.Data.Stores;
using System;

namespace SourceAPI.Core.Repository
{
    public class SourceStoreRepository_Json : EzyEFStoreRepository
    {
        public static sp_GetSMSQueueReport_JsonResult[] sp_GetSMSQueueReport_Json_Run(sp_GetSMSQueueReport_JsonParam param)
        {
            sp_GetSMSQueueReport_JsonResult[] resultData = null;
            resultData = Exec_JsonStoredProceduce_GetArray<sp_GetSMSQueueReport_JsonResult, sp_GetSMSQueueReport_JsonParam>(
                param, EEzyStoredProcedureNames.sp_GetSMSQueueReport_Json);
            return resultData;
        }
        public static sp_GetMessageQueueReport_JsonResult[] sp_GetMessageQueueReport_Json_Run(sp_GetMessageQueueReport_JsonParam param)
        {
            sp_GetMessageQueueReport_JsonResult[] resultData = null;
            resultData = Exec_JsonStoredProceduce_GetArray<sp_GetMessageQueueReport_JsonResult, sp_GetMessageQueueReport_JsonParam>(
                param, EEzyStoredProcedureNames.sp_GetMessageQueueReport_Json);
            return resultData;
        }
        public static void Exec_JsonStoredProceduce_GetArray<TParam>(TParam param, EEzyStoredProcedureNames eStoredProcedureName)
        {
            Exec_JsonStoredProceduce_GetArray<SP_EmptyResult, TParam>(param, eStoredProcedureName);
        }
        public static TResult[] Exec_JsonStoredProceduce_GetArray<TResult, TParam>(TParam param, EEzyStoredProcedureNames eStoredProcedureName) where TResult : class
        {
            TResult[] results = null;
            results = Exec_JsonStoredProceduce<TResult[], TParam>(param, eStoredProcedureName);
            if (results == null)
            {
                results = new TResult[0];
            }
            return results;
        }
        public static TResult Exec_JsonStoredProceduce<TResult, TParam>(TParam param, EEzyStoredProcedureNames eStoredProcedureName) where TResult : class
        {
            return Exec_JsonStoredProceduce<TResult, TParam>(string.Empty, param, eStoredProcedureName);
        }
        public static TResult Exec_JsonStoredProceduce<TResult, TParam>(string sConnectionString, TParam param, EEzyStoredProcedureNames eStoredProcedureName) where TResult : class
        {
            TResult resultData = null;
            string sParamJson = JsonHelper.SerializeObject(param);
            string sStoredProcedureName = Enum.GetName(typeof(EEzyStoredProcedureNames), eStoredProcedureName);

            string sJsonOutput = Exec_JsonStored_RAW_AnySP(sConnectionString,
                sStoredProcedureName, sParamJson);
            if (!string.IsNullOrEmpty(sJsonOutput))
            {
                resultData = JsonHelper.DeserializeObject<TResult>(sJsonOutput);
            }
            return resultData;
        }
    }
}