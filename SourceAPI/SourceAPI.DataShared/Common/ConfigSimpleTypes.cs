using Ezy.APIService.Core.Data;

namespace SourceAPI.DataShared.Common
{
    public partial class ConfigSimpleTypes : IConfigSimpleType
    {
        public const string FinancialExpenseFrequencyUnit = "FinancialExpenseFrequencyUnit";
        public const string FinancialNumOfDependant = "FinancialNumOfDependant";

        public const string SecurityCompletedYear = "SecurityCompletedYear";
        public const string SecurityNumOfFloor = "SecurityNumOfFloor";
        public const string SecurityNumOfBedroom = "SecurityNumOfBedroom";
        public const string ApplicantIDCardInputType = "ApplicantIDCardInputType";
        public const string ApplicantIDCardInputMode = "ApplicantIDCardInputMode";
        public const string UploadEntityType = "DocumentUploadEntityType";
        public const string CreditRuleEntityType = "CreditRuleEntityType";
        public const string ZohoAPIType = "ZohoAPIType";
        public const string AdditionalFundsPurposeType = "AdditionalFundsPurposeType";
      
    }
    public partial class ConfigDebSimpleTypes
    {
        public const string ApplicantType = "ApplicantType";
        public const string ExpenseGroupType = "ExpenseGroupType";
        public const string NumOfFloor = "NumOfFloor";
        public const string CompletedYear = "CompletedYear";
        public const string NumOfBedroom = "NumOfBedroom";
        public const string ApplicantMode = "ApplicantMode";
        public const string YesNo = "YesNo";
        public const string ValuationComparability = "ValuationComparability";
    }
}
