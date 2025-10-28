using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SourceAPI.DataShared.Common
{
    public class RHLCalculatorStatusCodes
    {
        public const string WAITING = "WAITING";
        public const string LATEST = "LATEST";
        public const string NOTWORKING = "NOTWORKING";
    }
    public class LiabilityTypeCodes
    {
        public const string ExistingMortgage = "ExistingMortgage";
        public const string CreditCards_StoredCards = "CreditCards_StoredCards";
        public const string Leases_HirePurchase = "Leases_HirePurchase";
        public const string PersonalLoans_BankFacilities_Overdrafts = "PersonalLoans_BankFacilities_Overdrafts";
        public const string Other = "Other";
        public const string HECS_HELP = "HECS_HELP";
        public const string ChildMaintenance = "ChildMaintenance";
        public const string Other_Other = "Other_Other";
    }
    public class EmploymentTypeCodes
    {
        public const string SelfEmployed = "SelfEmployed";
        public const string PAYG = "PAYG";
        public const string Other = "Other";
    }
    public class SecurityPurposeCodes
    {
        // group 1
        public const string Purchase = "Purchase";
      // group 2
        public const string Refinance = "Refinance";
        public const string EquityRelease = "EquityRelease";
    }
    public class AssetTypeCodes
    {
        public const string Rental_Prefix = "Rental";
        public const string ExistingProperty = "ExistingProperty";
        public const string SuperannuationIncome = "SuperannuationIncome";
        public const string SavingsAndInvestment = "SavingInvestmentNotThisProperty";
        public const string Other = "Other";
    }

    public class IncomeTypeCodes
    {
        public const string Bonus = "Bonus";
        public const string Commission = "Commission";
        public const string Dividends = "Dividends";
        public const string Overtime = "Overtime";
        public const string CarAllowance = "CarAllowance";
        public const string GovernmentAgePension = "GovernmentAgePension";
        public const string OtherGovernmentBenefits = "OtherGovernmentBenefits";
        public const string OtherPension = "OtherPension";
        public const string MotorVehicleExpenses = "MotorVehicleExpenses";
        public const string Depreciation = "Depreciation";
        public const string InterestOfLoansBeingRefinanced = "InterestOfLoansBeingRefinanced";
        public const string OtherSelfEmployedAddbacks = "OtherSelfEmployedAddbacks";
        public const string CentrelinkPayments = "CentrelinkPayments";
        public const string Investments = "Investments";
        public const string DistributionsFromTrusts = "DistributionsFromTrusts";
        public const string Other = "Other";
    }
    public class PostcodeCategoryCodes
    {
        public const string Cat01 = "Cat01";
        public const string Cat02 = "Cat02";
        public const string Cat03 = "Cat03";
        public const string Cat04 = "Cat04";
    }
    public class LoanPurposeCodes
    {
        public const string Purchase_FoundHouse = "Purchase_FoundHouse";
        public const string Purchase_LookingHouse = "Purchase_LookingHouse";
        public const string Purchase_Investment_FoundPro = "Purchase_Investment_FoundPro";
        public const string Purchase_Investment_LookingPro = "Purchase_Investment_LookingPro";

        public const string EquityRelease_Investment = "EquityRelease_Investment";
        public const string EquityRelease_OwnerOccupier = "EquityRelease_OwnerOccupier";
        public const string Refinance_Investment = "Refinance_Investment";
        public const string Refinance_OwnerOccupier = "Refinance_OwnerOccupier";
    }
    public class LoanPurposeGroupCodes
    {
        public const string Investment = "Investment";
        public const string OwnerOccupier = "OwnerOccupier";
    }
    public class LoanPurposeGroupNames
    {
        public const string Investment = "Investment";
        public const string OwnerOccupier = "Owner Occupier";

    }

    public class IDCardInputModes
    {
        public const string Upload = "Upload";
        public const string ManualEnter = "ManualEnter";
    }
   
    public class ExpenseFrequencyTypes
    {
        public const string Daily = "Daily";
        public const string Weekly = "Weekly";
        public const string Monthly = "Monthly";
        public const string Yearly = "Yearly";
    }
}
