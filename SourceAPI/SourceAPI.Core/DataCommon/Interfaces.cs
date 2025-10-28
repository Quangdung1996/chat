using Ezy.APIService.Core.Data;
using Ezy.Module.BaseData.Interfaces;
using Ezy.Module.Library.Data;
using System;

namespace SourceAPI.Core.Data
{
    public interface IESCDisplayInfo : IEzyDisplayInfo
    {
    }

    public interface ILocationModel
    {
        double? Latitude
        {
            get; set;
        }

        double? Longitude
        {
            get; set;
        }

        string DeviceNumber
        {
            get; set;
        }
    }
    public interface INeedLogEntity2
    {
        long? Log_CreatedById { get; set; }
        string Log_FromIP { get; set; }
    }

    public interface IHasGuidEntity : IEzyHasGuidEntity
    {
    }

    public interface IProjectChildModel : IEzyProjectChildModel
    {
    }

    public interface IDoiTCStoredEntity
    {
        long? DoiTC_Id { get; set; }

        string DoiTC_Text { get; set; }

        string DoiTC_GUID { get; set; }

        string DoiTC_CompanyName { get; set; }

        string DoiTC_ContactEmail { get; set; }

        string DoiTC_ContactName { get; set; }

        string DoiTC_ContactPhone { get; set; }

        string DoiTC_ContactTitle { get; set; }
    }

    public interface IProjectChild : IEzyProjectChild
    {
    }

    public interface IProjectChildInfo : IProjectChild
    {
    }

    public interface IProjectBasicReportParamModel : IProjectChildModel
    {
        string Project_PMId { get; set; }

        string Project_BDLeadId { get; set; }

        string Project_StageId { get; set; }

        bool? Project_ShowInPlanweek { get; set; }
    }

    public interface IProjectBasicReportModel : IProjectChildModel
    {
        string ProjectName { get; set; }

        string Project_PMId { get; set; }

        string Project_BDLeadId { get; set; }

        string Project_StageId { get; set; }

        string Project_PMName { get; set; }

        string Project_BDLeadName { get; set; }

        string Project_StageName { get; set; }

        string Project_ColorCode { get; set; }

        bool Project_HasPhaseInfo { get; set; }

        bool? Project_ShowInPlanweek { get; set; }

        bool? Project_ShowInMainternance { get; set; }
    }

    public interface IProjectBasicReportOptionModel
    {
        BaseCategoryItem[] ProjectList { get; set; }

        BaseCategoryItem[] Project_PMList { get; set; }

        BaseCategoryItem[] Project_BDLeadList { get; set; }

        BaseCategoryItem[] Project_StageList { get; set; }

        BaseCategoryItem[] ProjectInUseList { get; set; }
    }

    public interface ICheckConditionToEdit : IEzyCheckConditionToEdit
    {
    }

    public interface IHasOrderNo
    {
        int OrderNo { get; set; }
    }

    public interface ISourceEntity : IEFBaseEntity
    {
    }
    public interface IBaseStaffSuitePermissionBaseEntity : IEzyStaffSuitePerBaseEntity
    { }
    public interface IBasicDeliveryEntity
    {
        long? PaymentTypeId { get; set; }
    }

    public interface IDeliveryEntity : ISourceEntity
    {
        long? ShipperId { get; set; }

        long? SupplierDeliveryId { get; set; }

        int StatusDelivery { get; set; }

        long? ConfigBillDeliveryTroubleId { get; set; }

        bool IsDelivery { get; set; }

        decimal? MoneyWithDistrict4Shipper { get; set; }

        long? ConfigMoneyWithDistrict4ShipperId { get; set; }

        long? PaymentTypeId { get; set; }

        DateTime? DeliveredAt { get; set; }

        DateTime? PickUpAt { get; set; }
    }

    public interface IHasIdAndNameEntity : IEzyIdAndNameEntity
    {
    }

    public interface IHasCodeAndNameEntity : IEzyCodeAndNameEntity
    {
    }

    public interface IConfirmApprovedEntity
    {
        bool IsConfirmed { get; set; }

        bool IsApproved { get; set; }
    }

    public interface ICheckBelongValueEntity : IEzyCheckBelongValueEntity
    {
    }
    public interface ICheckBelongValueEntity2 : IEzyCheckBelongValueEntity2
    {
    }
    public interface ICheckUsingBeforeDelete
    {
    }

    /// <summary>
    /// vi day la interface xai chung voi google sheet nen ten field la ten thuong
    /// </summary>
    public interface ITemplateApplicable : ISourceEntity
    {
        long? ProjectId { get; set; }

        long? GetTemplateId();

        void SetTemplateId(long? templateId);
    }

    public interface IHRStaffSuiteOption : IEzyHRStaffSuiteOption
    {
    }

    public interface IProject_File : IEzyProject_File, IFileEntity, IHasGuidEntity
    {
    }

    public interface IFileEntity : IEzyFileEntity
    {
    }

    public interface IEzyIdAndName_IconEntity : IEzyIdAndNameEntity
    {
        string IconUrl { get; set; }

        string ColorCode { get; set; }

        string ColorCodeBG { get; set; }
    }
    public interface IEzyCodeAndName_IconEntity : IEzyCodeAndNameEntity
    {
        string IconUrl { get; set; }

        string ColorCode { get; set; }

        string ColorCodeBG { get; set; }
    }

    public interface IHasApplicantInfo
    {
        string FirstName { get; set; }
        string MiddleName { get; set; }
        string Surname { get; set; }
        string FullName { get; set; }
        DateTime? DateOfBirth { get; set; }
    }
}
