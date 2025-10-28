//using DevExpress.XtraReports.UI;
using Ezy.ApiService.ReleaseService.Helper;
using Ezy.APIService.Core.DataInfo;
using Ezy.APIService.Shared.Helper;
using Ezy.APIService.Shared.Models;
using Ezy.APIService.Shared.Services;
using Ezy.Module.BaseData.DataInfo;
using Ezy.Module.BaseData.Interfaces;
using Ezy.Module.BaseData.Models;
using Ezy.Module.Library.UI;
using Ezy.Module.Library.Utilities;
using Ezy.Module.Media.Utilities;
using SourceAPI.Core.Data;
using SourceAPI.DataShared.Services;
using SourceAPI.Shared.Helper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Reflection;

namespace SourceAPI.Shared.Services
{
    /// <summary>
    /// class chung cho 1 man hinh category
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <typeparam name="TModel"></typeparam>
    /// <typeparam name="TModelList"></typeparam>
    /// <typeparam name="TParam"></typeparam>
    /// <typeparam name="TOption"></typeparam>
    public class EFBaseCategoryService<T, TModel, TModelList, TParam, TOption> : EFEzyBaseCategoryService<T, TModel, TModelList, TParam, TOption>
        where T : class, IEFBaseEntity, new()
        where TModel : EzyBaseModel, new()
        where TParam : EzyBaseParamModel, new()
        where TModelList : EzyBaseModel, new()
         where TOption : BaseCategoryOptionModel, new()
    {

        public static readonly string error_entity_expired = "error_entity_expired";
        public string ErrorMsgEntityNull = "Entity Is NULL";
        public Dictionary<string, string[]> Dic_UpdateFields = null;
        public string[] UpdateIgnoredFields = null;
        public EFBaseCategoryService()
        {
            CanExportToExcel = true;
            CanExportExcelToGS = false;
            ProjectIdIsNotRequired = true;
            ErrorMsgEntityNull = SystemText_GetValue("msg_entity_notfound", "Entity Is NULL");
        }

        //public static string DateTimeToText(DateTime? d)
        //{
        //    return JHLDateTimeHelper.DateTime_ToClient_String(d);
        //}

        //public static DateTime? TextToDateTime(string sDate)
        //{
        //    return JHLDateTimeHelper.DateTime_ToServer_String(sDate);
        //}

        public override void RefineModelData_Always(TModel model)
        {
            if (model != null)
            {
                base.RefineModelData_Always(model);
                RefineListData_Always(new TModelList[] { model as TModelList });
            }
        }

        #region CheckDownload

        //public FileWillBeDownloadDetail[] CheckDownload<TFileDownLoad>(IEnumerable<TFileDownLoad> data, EFFileWillBeDownloadDetailParam param) where TFileDownLoad : class, IFileWillBeDownload
        //{
        //    if (string.IsNullOrEmpty(param.EmailAddress))
        //    {
        //        param.EmailAddress = this.LogBy;
        //    }
        //    FileWillBeDownloadDetail[] fileDownloadDetails = EFFileWillBeDownloadHelper.CheckDownload<TFileDownLoad>(data, param);
        //    return fileDownloadDetails;
        //}

        //public FileWillBeDownloadDetail[] CheckDownload<TFileDownLoad>(IEnumerable<TFileDownLoad> data, long? ProjectId, string EntityType, string SourceFileName, string url) where TFileDownLoad : class, IFileWillBeDownload
        //{
        //    FileWillBeDownloadDetail[] fileDownloadDetails = CheckDownload<TFileDownLoad>(data,

        //        new EFFileWillBeDownloadDetailParam()
        //        {
        //            ProjectId = ProjectId,
        //            EntityType = EntityType,
        //            SourceFileName = SourceFileName,
        //            url = url,
        //            EmailAddress = this.LogBy
        //        });

        //    #region Code cu -> move qua  EFFileWillBeDownloadHelper

        //    //using (var repo = EzyEFRepository<FileWillBeDownload>.CreateInstance(LogBy))
        //    //{
        //    //    var fileDownload = repo.GetQueryable().Where(w =>
        //    //        w.Email == GSCurrentUser.EmailAddress && w.StatusDownload == false &&
        //    //        w.EntityType == EntityType &&
        //    //        w.ScreenCode4Download == url && w.ProjectId == ProjectId
        //    //    ).FirstOrDefault();

        //    //    if (fileDownload != null)
        //    //    {
        //    //        if (!fileDownload.IsDeleted)
        //    //        {
        //    //            using (var repo2 = EzyEFRepository<FileWillBeDownloadDetail>.CreateInstance(LogBy))
        //    //            {
        //    //                fileDownloadDetails = repo2.GetQueryable().Where(w =>
        //    //                    w.FileWillBeDownloadId == fileDownload.Id).ToArray();
        //    //            }
        //    //        }
        //    //    }
        //    //}
        //    //if (fileDownloadDetails != null && fileDownloadDetails.Length > 0)
        //    //{
        //    //    if (data != null)
        //    //    {
        //    //        foreach (var item in data)
        //    //        {
        //    //            var SrcFileId = ID_ConvertStringToId(item.Id);
        //    //            item.CheckDownload = fileDownloadDetails.Any(t => t.SourceFileId == SrcFileId
        //    //            && t.SourceFileName == SourceFileName
        //    //            && t.GGFileId == item.GGFileId);
        //    //        }
        //    //    }
        //    //}

        //    #endregion Code cu -> move qua  EFFileWillBeDownloadHelper

        //    return fileDownloadDetails;
        //}

        //public string DeleteFileWillBeDownload(long Id)
        //{
        //    using (var repo = EzyEFRepository<FileWillBeDownload>.CreateInstance(LogBy))
        //    {
        //        var Item = repo.GetById(Id);
        //        if (Item != null)
        //        {
        //            Item.IsDeleted = true;
        //            return repo.Update(Item);
        //        }
        //        else return "Can't delete master file download";
        //    }
        //}

        //public List<FileWillBeDownloadDetail> GetFileWillBeDownloadDetail(long MasterId, long? ProjectId, long SourceFileId, string SourceFileName, string FileId, bool IsCheck)
        //{
        //    List<FileWillBeDownloadDetail> fileDownloadDetails = new List<FileWillBeDownloadDetail>();
        //    fileDownloadDetails = GetFileWillBeDownloadDetailMulti(MasterId,
        //        ProjectId,
        //        SourceFileName,
        //        new FileWillBeDownloadDetailDownloadModel[] { new FileWillBeDownloadDetailDownloadModel() { SourceFileId = SourceFileId, FileId = FileId } },
        //        IsCheck);

        //    #region code cu move het xuong GetFileWillBeDownloadDetailMulti

        //    //using (var repo = EzyEFRepository<FileWillBeDownloadDetail>.CreateInstance(LogBy))
        //    //{
        //    //    fileDownloadDetails = repo.GetQueryableIncludeDeleted().Where(w =>
        //    //            w.FileWillBeDownloadId == MasterId).ToList();
        //    //    var detail = fileDownloadDetails.Where(w => w.SourceFileName == SourceFileName && w.SourceFileId == SourceFileId).FirstOrDefault();
        //    //    //Kiểm tra detail chưa có thì tạo
        //    //    if (detail == null)
        //    //    {
        //    //        FileWillBeDownloadDetail newData = new FileWillBeDownloadDetail
        //    //        {
        //    //            FileWillBeDownloadId = MasterId,
        //    //            GGFileId = FileId,
        //    //            SourceFileName = SourceFileName,
        //    //            SourceFileId = SourceFileId,
        //    //            ProjectId = ProjectId,
        //    //            IsDeleted = false,
        //    //            IsCheckDownload = true
        //    //        };
        //    //        repo.Insert(newData);
        //    //        fileDownloadDetails.Add(newData);
        //    //    }
        //    //    else
        //    //    {
        //    //        //Nếu CheckDownload = true => IsDeleted = false : => true
        //    //        detail.IsDeleted = !IsCheck;
        //    //        repo.Update(detail);
        //    //    }
        //    //}

        //    #endregion code cu move het xuong GetFileWillBeDownloadDetailMulti

        //    return fileDownloadDetails;
        //}

        //public List<FileWillBeDownloadDetail> GetFileWillBeDownloadDetailMulti(long MasterId, long? ProjectId, string SourceFileName, FileWillBeDownloadDetailDownloadModel[] files, bool IsCheck)
        //{
        //    List<FileWillBeDownloadDetail> fileDownloadDetails = new List<FileWillBeDownloadDetail>();
        //    fileDownloadDetails = EFFileWillBeDownloadHelper.GetFileWillBeDownloadDetailMulti(new EFFileWillBeDownloadDetailParam()
        //    {
        //        MasterId = MasterId,
        //        ProjectId = ProjectId,
        //        SourceFileName = SourceFileName,
        //        IsCheck = IsCheck,
        //        Files = files,
        //        EmailAddress = this.LogBy
        //    });

        //    #region Code cu -> move qua  EFFileWillBeDownloadHelper

        //    //using (var repo = EzyEFRepository<FileWillBeDownloadDetail>.CreateInstance(LogBy))
        //    //{
        //    //    fileDownloadDetails = repo.GetQueryableIncludeDeleted().Where(w =>
        //    //            w.FileWillBeDownloadId == MasterId && w.SourceFileName == SourceFileName).ToList();
        //    //    var dic_fileDownloadDetails = DictionaryHelper.BuildDictionary(fileDownloadDetails, f => string.Format("{0}_{1}", f.SourceFileId, f.GGFileId), true);

        //    //    List<FileWillBeDownloadDetail> insert_items = new List<FileWillBeDownloadDetail>();

        //    //    List<FileWillBeDownloadDetail> update_items = new List<FileWillBeDownloadDetail>();
        //    //    foreach (var file in files)
        //    //    {
        //    //        FileWillBeDownloadDetail detail = null;
        //    //        string sKey = string.Format("{0}_{1}", file.SourceFileId, file.FileId);
        //    //        if (dic_fileDownloadDetails.IsContainsKey(sKey))
        //    //        {
        //    //            detail = dic_fileDownloadDetails[sKey].FirstOrDefault();
        //    //        }
        //    //        //Kiểm tra detail chưa có thì tạo
        //    //        if (detail == null)
        //    //        {
        //    //            FileWillBeDownloadDetail newData = new FileWillBeDownloadDetail
        //    //            {
        //    //                FileWillBeDownloadId = MasterId,
        //    //                GGFileId = file.FileId,
        //    //                SourceFileName = SourceFileName,
        //    //                SourceFileId = file.SourceFileId,
        //    //                ProjectId = ProjectId,
        //    //                IsDeleted = false,
        //    //                IsCheckDownload = true
        //    //            };
        //    //            insert_items.Add(newData);

        //    //        }
        //    //        else
        //    //        {
        //    //            //Nếu CheckDownload = true => IsDeleted = false : => true
        //    //            detail.IsDeleted = !IsCheck;
        //    //            update_items.Add(detail);
        //    //        }
        //    //    }
        //    //    if (insert_items.Count > 0)
        //    //    {
        //    //        repo.Insert(insert_items);
        //    //        fileDownloadDetails.AddRange(insert_items);
        //    //    }
        //    //    if (update_items.Count > 0)
        //    //    {
        //    //        repo.Update(update_items);
        //    //    }

        //    //}

        //    #endregion Code cu -> move qua  EFFileWillBeDownloadHelper

        //    return fileDownloadDetails;
        //}

        //public FileWillBeDownload GetFileWillBeDownload(EFFileWillBeDownloadParam param)
        //{
        //    FileWillBeDownload fileDownload = null;
        //    try
        //    {
        //        fileDownload = EFFileWillBeDownloadHelper.GetFileWillBeDownload(param);
        //    }
        //    catch (Exception ex)
        //    {
        //        SaveLogException(ex, "GetFileWillBeDownload", param);
        //    }
        //    return fileDownload;
        //}

        //public FileWillBeDownload GetFileWillBeDownload(long? ProjectId, string EntityType, string sUrl, bool IsCheck)
        //{
        //    FileWillBeDownload fileDownload = null;
        //    try
        //    {
        //        fileDownload = GetFileWillBeDownload(new EFFileWillBeDownloadParam()
        //        {
        //            IsCreateIfNotExist = true,
        //            ProjectId = ProjectId,
        //            EmailAddress = this.LogBy,
        //            EntityType = EntityType,
        //            url = sUrl,
        //            IsIgnoredScreenCode = false
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        SaveLogException(ex, "GetFileWillBeDownload", $"{EntityType} - {sUrl}");
        //    }
        //    return fileDownload;
        //}

        #endregion CheckDownload

        //public string[] GetStaffEmailMemberOfUserlogin()
        //{
        //    var staffIds = GetStaffMemberOfUserlogin();
        //    return CachedDataManagement.Staffs.Where(t => staffIds.Contains(t.Id)).Select(t => t.EmailAddress).ToArray();
        //}

        //public string[] GetStaffEmailMemberOfUserlogin(string ScreenCode)
        //{
        //    var staffIds = GetStaffMemberOfUserlogin_IncludeUserLoginId(ScreenCode);
        //    return CachedDataManagement.Staffs.Where(t => staffIds.Contains(t.Id)).Select(t => t.EmailAddress).ToArray();
        //}

        //public bool SystemFunctionSetting_HasPermission_For_ScreenCode(string sKey, SolidStaffInfo user, long? iProjectId, bool defaultValue)
        //{
        //    return SystemFunctionSetting_HasPermission_For_ScreenCode(sKey, ScreenCode, user, iProjectId, defaultValue);
        //}

        //public bool SystemFunctionSetting_HasPermission_For_ScreenCode(string sKey, string screenCode, SolidStaffInfo user, long? iProjectId, bool defaultValue)
        //{
        //    var funcKey = $"{sKey}_{screenCode}";
        //    if (SystemFunctionSetting_CheckKeyExist(funcKey) == false)
        //        funcKey = sKey;
        //    return SystemFunctionSetting_HasPermission(funcKey, user, iProjectId, defaultValue);
        //}

        //public bool SystemFunctionSetting_CheckKeyExist(string sKey)
        //{
        //    bool result = false;
        //    var settings = CachedDataManagement.SystemFunctionGroupSetting_Get_Instance_Key(sKey);
        //    if (settings != null && settings.Count() > 0)
        //        result = true;
        //    return result;
        //}

        public override ReportExportResultToClientModel AddNewSystemTestUnit_GetList(object model)
        {
            return base.AddNewSystemTestUnit_GetList(model);
        }

        private string[] labels = null;

        /// <summary>
        /// Bổ sung các label muốn gắn thêm vào header
        /// </summary>
        /// <param name="moreLabels"></param>
        public virtual void AddMoreLabelToPDFGeneral(string[] moreLabels)
        {
            labels = moreLabels;
        }

        public override ReportExportToPDFGeneralResultModel ExportToPDFGeneral(TParam param, out string sMessage)
        {
            ReportExportToPDFGeneralResultModel result = null;
            sMessage = string.Empty;
            try
            {
                //result = base.ExportToPDFGeneral(param, out sMessage);
                //if (string.IsNullOrEmpty(sMessage))
                //{
                //    XtraReport rep = new XtraReport();
                //    rep.DataSource = result.ExportPDFData;
                //    rep.DataMember = ((DataSet)rep.DataSource).Tables[0].TableName;
                //    #region File Path

                //    string filename = string.Empty;
                //    string filenameParams = System.IO.Path.GetFileNameWithoutExtension("ReportGeneral.repx");
                //    filenameParams = typeof(T).Name + "_" + Guid.NewGuid().ToString();
                //    filename = ReportingServiceHelper.GetFullPath(filenameParams + ".pdf");
                //    result.LocalPath = filename;
                //    result.IsScussess = true;
                //    result.FullPath = filename.Replace(AppDomain.CurrentDomain.BaseDirectory, PictureHelper.ROOT_FOLDER);
                //    result.FullPath = EzyPictureHelper.GetFullUrl_Server(filename);

                //    #endregion File Path

                //    rep.ExportToPdf(filename);
                //}
            }
            catch (Exception ex)
            {
                sMessage = Exception_GetMessage(ex);
                SaveLogException(ex, "ExportToPDFGeneral", param);
            }
            return result;
        }

        public ReportExportToPDFGeneralResultModel ExportToPDFGeneral_Pivot(EzyDataSourceResult<Dictionary<string, object>> pivotData, TParam param, out string sMessage)
        {
            string sFileName = ExportExcelGS_GetFileName(param);
            var result = ExportToPDF(pivotData.Data.ToArray(), pivotData.ExtraData, sFileName, out sMessage);
            //if (string.IsNullOrEmpty(sMessage))
            //{
            //    XtraReport rep = new XtraReport();
            //    rep.DataSource = result.ExportPDFData;
            //    rep.DataMember = ((DataSet)rep.DataSource).Tables[0].TableName;
            //    #region File Path

            //    string filename = string.Empty;
            //    string filenameParams = System.IO.Path.GetFileNameWithoutExtension("ReportGeneral.repx");
            //    filenameParams = typeof(T).Name.Replace("sp_", "").Replace("_Json", "").Replace("_json", "") + "_" + Guid.NewGuid().ToString();
            //    filename = ReportingServiceHelper.GetFullPath(filenameParams + ".pdf");
            //    result.LocalPath = filename;
            //    result.IsScussess = true;
            //    result.FullPath = filename.Replace(AppDomain.CurrentDomain.BaseDirectory, PictureHelper.ROOT_FOLDER);
            //    result.FullPath = EzyPictureHelper.GetFullUrl_Server(filename);

            //    #endregion File Path

            //    rep.ExportToPdf(filename);
            //}
            return result;
        }

        #region Refine columns

        public override void ExtraDataColumnRefine(Dictionary<string, SolidFieldOption> columns)
        {
            base.ExtraDataColumnRefine(columns);
            if (columns != null)
            {
                columns = GetColumns_Actions(columns);
                bool isV3 = UI_IsV3();
                if (isV3 == true)
                {
                    GetColumns_Refine4V3(columns);
                }
            }
        }

        public bool UI_IsV3()
        {
            bool isV3 = false;
            if (this.Param != null && this.Param.Url != null)
            {
                if (this.Param.Url.Contains("#/dashboardv3") || this.Param.Url.Contains("#/v3"))
                {
                    isV3 = true;
                }
            }
            return isV3;
        }

        public void GetColumns_Refine4V3(Dictionary<string, SolidFieldOption> columns)
        {
            if (columns != null && columns.Count > 0)
            {
                foreach (var clItem in columns)
                {
                    var cl = clItem.Value;
                    if (cl.Filter != null && cl.Filter.type != null && cl.Filter.type.Contains("select"))
                    {
                        var dicMore = DictionaryHelper.ParseDic(cl.Filter.more);
                        var ov3Type = DictionaryHelper.GetValue_Dic(dicMore, "v3Type");
                        string sV3Type = StringHelper.ObjectToString(ov3Type);
                        if (!string.IsNullOrEmpty(sV3Type))
                        {
                            cl.Filter.type = sV3Type;
                        }
                    }
                }
            }
        }

        public virtual Dictionary<string, SolidFieldOption> GetColumns_Actions(Dictionary<string, SolidFieldOption> columns)
        {
            if (columns != null && columns.Count > 0)
            {
                var clAction = columns.Where(c => c.Value.Type.type == "action" && c.Value.CanShow == true).Select(c => c.Value).FirstOrDefault();
                if (clAction != null)
                {
                    List<Dictionary<string, object>> listButtons = new List<Dictionary<string, object>>();

                    string[] sButtonTypes = new string[] { "api", "form", "modal" };
                    var btColumns = columns.Where(c => sButtonTypes.Contains(c.Value.Type.type) && c.Value.CanShow == true).ToArray();
                    if (btColumns != null && btColumns.Length > 0)
                    {
                        foreach (var btColumn in btColumns)
                        {
                            var btValue = btColumn.Value;
                            var btMore = DictionaryHelper.ParseDic(btValue.Type.more);
                            object oShowInAction = DictionaryHelper.GetValue_Dic(btMore, "showInAction");
                            if (oShowInAction != null && oShowInAction.ToString() == (true).ToString())
                            {
                                DictionaryHelper.SetValue_Dic(btMore, "type", btValue.Type.type);
                                DictionaryHelper.SetValue_Dic(btMore, "fDisplay", btColumn.Key);
                                listButtons.Add(btMore);
                                btValue.CanShow = false;
                            }
                        }
                    }
                    var actMore = DictionaryHelper.ParseDic(clAction.Type.more);
                    if (actMore == null)
                    {
                        actMore = new Dictionary<string, object>();
                    }
                    object oShowDelete = DictionaryHelper.GetValue_Dic(actMore, "showDeleteRow");
                    if (oShowDelete != null && oShowDelete.ToString() == (true).ToString())
                    {
                        if (CheckCanEdit() == true)
                        {
                            listButtons.Add(new Dictionary<string, object>() { { "type", "delete" } });
                        }
                    }
                    DictionaryHelper.SetValue_Dic(actMore, "listAction", listButtons);
                    clAction.Type.more = JsonHelper.SerializeObject(actMore);
                }
            }
            return columns;
        }

        private bool CheckCanEdit()
        {
            bool canEdit = true;
            if (IsReadOnlyUser == true || IsReadOnlyView == true)
            {
                canEdit = false;
            }
            return canEdit;
        }

        #endregion refine columns

        public override T ConvertToEntity(T e, TModel m, out bool bHaschange)
        {
            bHaschange = false;
            if (m != null)
            {
                if (e == null)
                {
                    e = new T();
                }
                e.Id = ID_ConvertStringToId(m.Id);
                if (e == null || e.Id == 0)
                {
                    bHaschange = true;
                    ObjectHelper.CopyPropertiesIgnoreNull(m, e, false, null, null);
                }
                else
                {
                    e = ConvertToEntity4Update(e, m, out bHaschange);
                }
                var bMoreChange = ConvertToEntity_SetMore(e, m);
                if (bMoreChange == true)
                {
                    bHaschange = true;
                }
            }
            return e;
        }

        public override TModel Update(TModel model, out string sMessage)
        {
            var bResult = base.Update(model, out sMessage);
            if (!string.IsNullOrEmpty(sMessage) && sMessage.Contains(ErrorMsgEntityNull, StringComparison.CurrentCultureIgnoreCase))
            {
                SaveLogException(new Exception(sMessage), "Update", model);
                sMessage = string.Empty;
            }
            return bResult;
        }

        public override void ConvertToEntity_SetDefautlValue(T e, TModel m)
        {
            base.ConvertToEntity_SetDefautlValue(e, m);
            var eLog = e as INeedLogEntity2;
            if (eLog != null)
            {
                SetLogInfoToEntity(eLog);
            }
        }
        //public virtual T ConvertToEntity4Update(T e, TModel m)
        //{
        //    var bHaschange = false;
        //}
        public virtual T ConvertToEntity4Update(T e, TModel m, out bool bHaschange)
        {
            bHaschange = false;
            #region LogMethodVersion

            MethodBase.GetCurrentMethod().LogMethodVersion("20220610-1358", "Cảnh báo dữ liệu client đã cũ",
                "https://allianceitscvn.atlassian.net/browse/ROA-400");

            #endregion LogMethodVersion
            if (e != null && e.Id > 0)
            {
#warning error_entity_expired - mo lai
                var rhlModel = m as SourceNoLogBaseModel;
                if (rhlModel != null && rhlModel.IM_ReturnTime > 0)
                {
                    //rhlModel.IM_ReturnTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                    var lastTime = GetTotalMilisecond(e.Log_UpdatedDate);
                    if (lastTime > 0 && lastTime > rhlModel.IM_ReturnTime)
                    {
                        throw (new Exception(error_entity_expired));
                    }
                }
                var fields = Dic_UpdateFiels_Get(m.Id);
                bHaschange = ObjectHelper.CopyPropertiesIgnoreNull(m, e, true, fields, UpdateIgnoredFields);

            }
            return e;
        }
        public virtual bool ConvertToEntity_SetMore(T e, TModel m)
        {
            bool bHaschange = false;

            return bHaschange;
        }

        #region Support Methods
        public void SetLogInfoToEntity<TEntity>(TEntity e) where TEntity : INeedLogEntity2
        {
            e.Log_CreatedById = ID_ConvertStringToPKId(this.UserLoginId);
            if (this.UI_LogItem != null)
            {
                e.Log_FromIP = this.UI_LogItem.ClientIP;
            }
        }
        public override string SystemText_GetValue(string sKey, string sDefault)
        {
            var sText = base.SystemText_GetValue(sKey, sDefault);
            if (sText == "#")
            {
                sText = string.Empty;
            }
            return sText;
        }
        public long? GetTotalMilisecondNow()
        {
            return GetTotalMilisecond(DateTime.Now);
        }
        public long? GetTotalMilisecond(DateTime? date)
        {
            long? dMili = null;
            if (date != null)
            {
                dMili = date.Value.ToFileTime();
            }
            return dMili;
        }
        public void Dic_UpdateFiels_Add(string sId, params string[] fields)
        {
            if (sId != null)
            {
                if (Dic_UpdateFields == null)
                {
                    Dic_UpdateFields = new Dictionary<string, string[]>();
                }
                DictionaryHelper.SetValue_Dic(Dic_UpdateFields, sId, fields);
            }

        }
        public string[] Dic_UpdateFiels_Get(string sId)
        {
            string[] fields = null;
            if (sId != null && Dic_UpdateFields != null)
            {
                fields = DictionaryHelper.GetValue_Dic(Dic_UpdateFields, sId);
            }
            return fields;
        }
        public static double? DateTimeUTC_ToClient(DateTime? dateTime)
        {
            double? result = null;
            if (dateTime != null)
            {
                result = (dateTime.Value - DateTime.UnixEpoch).TotalMilliseconds;
            }
            return result;
        }

        public static DateTime? DateTimeUTC_ToServer(double? dMiliSecond)
        {
            DateTime? result = null;
            if (dMiliSecond != null)
            {
                result = DateTime.UnixEpoch.AddMilliseconds(dMiliSecond.Value);
            }
            return result;
        }

        #endregion Support Methods

        #region Messages

        public string Message_GetInvalidMsg(string sKey, string sDefault)
        {
            string sMessage = SystemText_GetValue(sKey, sDefault);
            sMessage = Message_GetInvalidMsg(sMessage);
            return sMessage;
        }

        public string Message_GetInvalidMsg(string sMessage)
        {
            sMessage = Message_GetMessage(RHLResultCode.BadRequest, sMessage);
            return sMessage;
        }

        public string Message_GetNotFoundMsg(string sKey, string sDefault)
        {
            string sMessage = SystemText_GetValue(sKey, sDefault);
            sMessage = Message_GetNotFoundMsg(sMessage);
            return sMessage;
        }

        public string Message_GetNotFoundMsg(string sMessage)
        {
            sMessage = Message_GetMessage(RHLResultCode.NotFound, sMessage);
            return sMessage;
        }

        public string Message_GetNotFoundMsg<TEntity>(TEntity param, string sKey, string sDefault)
        {
            string sMessage = Message_GetNotFoundMsg(sKey, sDefault);
            sMessage = StringPatternHelper.ReplacePattern<TEntity>(param, sMessage);
            return sMessage;
        }

        public override string Exception_GetMessage(Exception ex)
        {
            string sMessage = ex.Message;
            if (ex.InnerException != null)
            {
                sMessage = $"{sMessage}||{ex.InnerException.Message}";
            }
            sMessage = Message_GetMessage(RHLResultCode.ServerError, sMessage);
            return sMessage;
        }

        public string Message_GetMessage(RHLResultCode statusCode, string sMessage)
        {
            sMessage = $"[MsgCode:{(int)statusCode}] {sMessage}";
            return sMessage;
        }
        public string Message_OCR_CanNotExtractDataMessage()
        {

            string sMessage = SystemText_GetValue("msg_ocr_cannotextract_data", "Sorry, we cannot extarct data from this image");
            // sMessage = Message_GetMessage(RHLR);
            return sMessage;
        }
        /// <summary>
        /// 
        /// This kind of Driver License is not supported. Please contact Admin
        /// </summary>
        /// <returns></returns>
        public string Message_OCR_NotSupportDriverLicenseTypeMessage()
        {
            //Driver License is not supported
            string sMessage = SystemText_GetValue("msg_ocr_notsupport_driverlicensetype", "This kind of Driver License is not supported. Please contact Admin");
            // sMessage = Message_GetMessage(RHLR);
            return sMessage;
        }
        /// <summary>
        /// This kind of Passport is not supported. Please contact Admin
        /// </summary>
        /// <returns></returns>
        public string Message_OCR_NotSupportPassportTypeMessage()
        {
            //Driver License is not supported
            string sMessage = SystemText_GetValue("msg_ocr_notsupport_passporttype", "This kind of Passport is not supported. Please contact Admin");
            // sMessage = Message_GetMessage(RHLR);
            return sMessage;
        }
        /// <summary>
        /// The card type not identified
        /// </summary>
        /// <returns></returns>
        public string Message_OCR_NotIdentifiedCardTypeMessage()
        {
            //Driver License is not supported
            string sMessage = SystemText_GetValue("msg_ocr_notidentified_cardtype", "The card type not identified");
            // sMessage = Message_GetMessage(RHLR);
            return sMessage;
        }


        #endregion Messages

        public static string GetAvatarUrl(SolidStaffInfo staff)
        {
            return SQLDataContextHelper.GetAvatarUrl(staff);
        }
    }
}