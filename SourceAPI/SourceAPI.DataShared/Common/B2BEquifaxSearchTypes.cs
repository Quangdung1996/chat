using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SourceAPI.DataShared.Common
{
    public class B2BEquifaxSearchTypes
    {
        public const string Individual_CCR = "Individual_CCR";
        public const string Individual_CCR_CCAI = "Individual_CCR_CCAI";
        public const string Individual_CCR_VS1 = "Individual_CCR_VS1";

        public const string Individual_V1 = "Individual_V1";
        public const string Individual_CCR_File = "Individual_CCR_File";
        public const string Company = "Company";
        public const string Company_V2 = "Company_V2";
        public const string CompanyTradingHistory = "CompanyTradingHistory";
        public const string CompanyIndepthTradingHistory = "CompanyIndepthTradingHistory";
        public const string IdMatrix = "IdMatrix";
        public const string VerificationServicesSuite = "VerificationServicesSuite";
        public const string BusinessEnquiry = "BusinessEnquiry";
        public const string BusinessTradingHistory = "BusinessTradingHistory";

        public static string[] CCR_GetScorecardIDsByType(string sType)
        {
            var scorecardIDs = new string[] { "VSA_2.0_XY_NR",
                           "VSA_2.0_XY_CR"};
            if (sType == B2BEquifaxSearchTypes.Individual_CCR_CCAI)
            {
                scorecardIDs = new string[] { "CCAI_2.0_YX_CR",
                           "CCAI_2.0_YX_NR"};
            }
            else if (sType == B2BEquifaxSearchTypes.Individual_CCR_VS1)
            {
                scorecardIDs = new string[] { "VS_1.1_XY_NR",
                           "VS_1.1_YX_NR"};
            }
            return scorecardIDs;
        }
        public static string File_GetConfigurationNameByType(string sType)
        {
            string sConfigurationName = null;
            if (sType == B2BEquifaxSearchTypes.Company_V2)
            {
                sConfigurationName = "COMPANY-ENQUIRY";
            }
            else if (sType == B2BEquifaxSearchTypes.CompanyTradingHistory)
            {
                sConfigurationName = "COMPANY";
            }
            else if (sType == B2BEquifaxSearchTypes.CompanyIndepthTradingHistory)
            {
                sConfigurationName = "INDEPTH";
            }
            else if (sType == B2BEquifaxSearchTypes.BusinessEnquiry)
            {
                sConfigurationName = "BUSINESS-ENQUIRY";
            }
            else if (sType == B2BEquifaxSearchTypes.BusinessTradingHistory)
            {
                sConfigurationName = "BUSINESS";
            }
            else if (sType == B2BEquifaxSearchTypes.IdMatrix)
            {
                sConfigurationName = B2BEquifaxSearchTypes.IdMatrix;
            }
            return sConfigurationName;
        }
    }
    public class ChecklistStepCodes
    {
        public const string SubmitDataToSE = "SubmitDataToSE";
        public const string SubmitDataToSE_EquifaxCCRSearch = "SubmitDataToSE_EquifaxCCRSearch";
    }
}
