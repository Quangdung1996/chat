using System;

namespace SourceAPI.Core.Data.Stores
{
    public enum EEzyStoredProcedureNames
    {
        sp_GetReportPayslipGrpByStaff_Json = 1,

        sp_GetReportMyPayOff_Json = 2,

        sp_GetIncorrect_DriverLicense_Json = 3,

        sp_GetIncorrect_Passport_Json = 4,

        sp_GetCheck_AllStaff_HasOneFile_Json = 5,

        sp_GetListPostcodeCheckInfo_Json = 6,

        sp_GetView_ConfigApplicationData4Copy_Applicant_Json = 7,

        sp_GetView_ConfigApplicationData4Copy_ApplicantHousehold_Json = 8,
        sp_RHL_ApplicationForm_Check_CombinationLoan_Json = 9,
        sp_GetMessageQueueReport_Json = 10,
        sp_GetSMSQueueReport_Json = 11,
        sp_GetReduceWebSupport_Url_Json = 12,
        sp_GetIPAddressFromLog_PropertyChanged_Today_Json = 13
    }
}
