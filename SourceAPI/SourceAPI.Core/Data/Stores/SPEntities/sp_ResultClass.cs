using System;

namespace SourceAPI.Core.Data.Stores
{
    public class sp_GetReduceWebSupport_Url_JsonResult
    { 
        public string ReduceUrl { get; set; }
    }
    public class sp_GetSMSQueueReport_JsonResult : sp_GetMessageQueueReport_JsonResult
    {
    }
    public class sp_GetMessageQueueReport_JsonResult
    { 
        public string Subject { get; set; }
        public string Body { get; set; }
        public string Receiver { get; set; }
        public DateTime? SentDate { get; set; }
        public DateTime? CreatedDate { get; set; }
        public string SendStatus { get; set; }
        public string Sender { get; set; }
        public string FromIP { get; set; }
        public string SQLAppName { get; set; }
        public string SendStatusFromTwilio { get; set; }
        public string ErrorMessage { get; set; }
        public string TrackingID { get; set; }
        public string RecipientMain { get; set; }
        public string SendStatusFromSendGrid { get; set; }
    }
    public class sp_RHL_ApplicationForm_Check_CombinationLoan_JsonResult
    {
        public bool result { get; set; }
    }
    public class sp_GetListPostcodeCheckInfo_JsonResult
    {
        public string StateCode { get; set; }
        public string StateName { get; set; }
        public string Postcode { get; set; }
        public string PostcodeCategory { get; set; }
        public string PostcodeCategoryCode { get; set; }
        public long PostcodeCategoryId { get; set; }
        public string Category
        {
            get
            {
                return PostcodeCategory;
            }
        }
    }
    public class sp_GetReportPayslipGrpByStaff_JsonResult
    {
        public long StaffId { get; set; }

        public string DisplayName { get; set; }

        public string StaffCode { get; set; }

        public string DepartmentName { get; set; }

        public string StaffStatus { get; set; }

        public int CountPayslip { get; set; }
    }
    public class sp_GetView_ConfigApplicationData4Copy_Applicant_JsonResult
    {
        public long ApplicationId { get; set; }
        public long? CreatedById { get; set; }
        public long? ApplicantId { get; set; }
        public string ApplicantName { get; set; }
        public string DataKey { get; set; }
    }
    public class sp_GetView_ConfigApplicationData4Copy_ApplicantHousehold_JsonResult
    {
        public string ApplicantIds { get; set; }
        public long ApplicationId { get; set; }
        public long? CreatedById { get; set; }
        public long? ApplicantHouseholdId { get; set; }
        public string ApplicantNames { get; set; }
        public string HouseholdName { get; set; }
    }
    public class sp_GetIPAddressFromLog_PropertyChanged_Today_JsonResult
    {
        public string IPAddress { get; set; }
    }
}
