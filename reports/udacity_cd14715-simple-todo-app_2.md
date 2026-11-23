# 🔍 Code Review Report

## Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | 32/100 |
| **Files Reviewed** | 1 |
| **Critical Issues** | 6 |
| **High Priority Tests** | 8 |
| **Refactoring Opportunities** | 7 |

## 🎯 Top Recommendations

1. 🚨 **Security**: SQL Injection vulnerabilities in three search/filter functions. The searchTodos, searchTodosByStatus, and getTodosByUser functions all use direct string interpolation and concatenation without parameterized queries. This allows attackers to execute arbitrary SQL commands, potentially exposing user data, modifying records, or deleting entire tables. These vulnerabilities directly contradict the security-aware comments in the code and represent a critical data exposure risk.
   - Files: src/todo.ts

2. 🚨 **Testing**: Zero test coverage detected. The file contains no automated tests despite implementing critical functions like createTodo, deleteTodo, and XSS sanitization. This is especially dangerous given the SQL injection vulnerabilities which should be caught by security-focused tests. All three vulnerable search functions and core CRUD operations require comprehensive test coverage.
   - Files: src/todo.ts

3. 🚨 **Security - Input Validation**: Missing input validation in searchTodosByStatus function. The function accepts a string parameter 'completed' but does not validate that it is 'true' or 'false' before concatenating into SQL. This lack of type checking combined with string concatenation creates a SQL injection vulnerability. Additionally, the parameter type should be boolean to match the domain model.
   - Files: src/todo.ts

4. ⚠️ **Security - LIKE Wildcard Injection**: SQL LIKE wildcard injection in searchTodos function. User input containing '%' or '_' characters will be interpreted as SQL LIKE wildcards, returning unintended results. For example, searching for '%' would return all records. This requires proper escaping or use of parameterized queries.
   - Files: src/todo.ts

5. ⚠️ **Error Handling**: Missing error handling in all three vulnerable search functions. Database query errors are not caught or handled gracefully, which could cause unhandled promise rejections. All async functions should include try-catch blocks or error propagation mechanisms.
   - Files: src/todo.ts

## 📁 File Details

### 📄 `src/todo.ts`

**Quality Score:** 32/100 | **Coverage:** ~15%

#### Issues (14)
  - Line 115: `critical` SQL injection vulnerability in searchTodos function. User input (keyword) is directly interpolated into SQL query using template literals without parameterization or sanitization.
  - Line 117: `critical` Direct SQL injection vulnerability - keyword parameter is embedded directly into SQL query without any protection mechanism.
  - Line 125: `critical` SQL injection vulnerability in searchTodosByStatus function. User input (completed) is concatenated directly into SQL query without parameterization, validation, or type checking.

  *...and 11 more*

#### Test Gaps (20)
  - `validateTodoInput (line 22)` (high priority)
  - `sanitizeInput (line 35)` (high priority)

  *...and 18 more*

#### Refactoring Opportunities (8)
  - **extract-function**: Create a helper function to safely construct WHERE clauses with parameterized queries. This prevents SQL injection vulnerabilities across multiple functions and reduces code duplication.
  - **modernize**: Replace multiple string.replace() calls with a more maintainable map-based approach. This reduces repetition and makes it easier to add or modify sanitization rules.

  *...and 6 more*

---

*Generated at 2026-11-23T00:00:00Z • Duration: 25000ms*
