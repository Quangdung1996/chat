using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace SourceAPI.DataShared.Services
{
    public class RHLApplicationDetailTabUICodes
    {
        [Display(Name = "Confirm your solution", Order = 1)]
        public const string tab_product = "tab_product";

        [Display(Name = "Who's on the loan", Order = 2)]
        public const string tab_applicant = "tab_applicant";

        [Display(Name = "Your Property", Order = 3)]
        public const string tab_property = "tab_property";

        [Display(Name = "Your Income", Order = 4)]
        public const string tab_income = "tab_income";

        [Display(Name = "Your Finances", Order = 5)]
        public const string tab_finance = "tab_finance";

        [Display(Name = "Review Your App", Order = 6)]
        public const string tab_summary = "tab_summary";

        [Display(Name = "Your Declarations", Order = 7)]
        public const string tab_declaration = "tab_declaration";

        [Display(Name = "Decision Time", Order = 8)]
        public const string tab_decision = "tab_decision";

        [Display(Name = "Verify your Income", Order = 9)]
        public const string tab_verify_income = "tab_verify_income";

        [Display(Name = "ID and credit check", Order = 10)]
        public const string tab_id_credit_check = "tab_id_credit_check";

        [Display(Name = "Credit history", Order = 11)]
        public const string tab_credit_history = "tab_credit_history";
        [Display(Name = "Decision Time 2", Order = 12)]
        public const string tab_decision_formal = "tab_decision_formal";


        [Display(Name = "Final Review", Order = 12)]
        public const string tab_summary_final = "tab_summary_final";

        [Display(Name = "Doc upload", Order = 13)]
        public const string tab_document = "tab_document";

        [Display(Name = "Calculator Mapping", Order = 14)]
        public const string tab_servicing = "tab_servicing";

        public static DisplayAttribute GetDisplayAttribute(string tab)
        {
            var field = typeof(RHLApplicationDetailTabUICodes).GetField(tab);
            var attribute = field?.GetCustomAttribute(typeof(DisplayAttribute)) as DisplayAttribute;
            return attribute;
        }
    }
}
