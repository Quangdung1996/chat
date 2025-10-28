using Ezy.APIService.Core.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SourceAPI.DataShared.Common
{
  public  class FunctionPermissionKeys: ISystemFuncPermissionKey
    {
        public const string Application_Calculator_CanView_ReviewNote = "Application_Calculator_CanView_ReviewNote";
        public const string Application_Calculator_CanViewUITab = "Application_Calculator_CanViewUITab";
        public const string Application_CanEdit_AfterSubmitToSoezy = "Application_CanEdit_AfterSubmitToSoezy";
        public const string Application_DecisionTime_CanViewEngineResult = "Application_DecisionTime_CanViewEngineResult";
        public const string Application_Calculator_CanRunCalculatorAlways = "Application_Calculator_CanRunCalculatorAlways";
        public const string Application_ConfirmProduct_CanSearchSolution = "Application_ConfirmProduct_CanSearchSolution";
        public const string Application_ConfirmProduct_CanResetSolution = "Application_ConfirmProduct_CanResetSolution";
        public const string Application_CanAddNewApp_OnOnlineSite = "Application_CanAddNewApp_OnOnlineSite";
        public const string Application_ConfirmProduct_CanEditTypeAndFeatures = "Application_ConfirmProduct_CanEditTypeAndFeatures";
        public const string Application_ConfirmProduct_CanViewSolutions = "Application_ConfirmProduct_CanViewSolutions";

        public const string Application_MyApp_CanSeeDeletedLoans = "Application_MyApp_CanSeeDeletedLoans";
        public const string Application_MyApp_CanDeleteLoans = "Application_MyApp_CanDeleteLoans";
        public const string Application_Document_CanResubmitLoans = "Application_Document_CanResubmitLoans";
        public const string Application_DecisionTime_CanViewException = "Application_DecisionTime_CanViewException";
        public const string Application_DecisionTime_CanEditException = "Application_DecisionTime_CanEditException";
        //public const string Application_CanEdit_EveryLoan = "Application_CanEdit_EveryLoan";
        public const string Application_View_Only_CanClone = "Application_View_Only_CanClone";
    }
}
