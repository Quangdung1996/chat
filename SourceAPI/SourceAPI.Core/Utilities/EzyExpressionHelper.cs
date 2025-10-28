using System;
using System.Linq.Expressions;

namespace SourceAPI.Core.Utilities
{
    public static class EzyExpressionHelper
    {
        public static string GetFieldName<T, TField>(Expression<Func<T, TField>> memberAccessExp)
        {
            if (memberAccessExp.Body is MemberExpression)
            {
                return ((MemberExpression)memberAccessExp.Body).Member.Name;
            }
            else
            {
                var op = ((UnaryExpression)memberAccessExp.Body).Operand;
                return ((MemberExpression)op).Member.Name;
            }
        }
    }
}
