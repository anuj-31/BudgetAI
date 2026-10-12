package in.anuj.moneymanager.controller;

import in.anuj.moneymanager.dto.ExpenseDTO;
import in.anuj.moneymanager.dto.IncomeDTO;
import in.anuj.moneymanager.entity.ProfileEntity;
import in.anuj.moneymanager.service.EmailService;
import in.anuj.moneymanager.service.ExpenseService;
import in.anuj.moneymanager.service.IncomeService;
import in.anuj.moneymanager.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/email")
@RequiredArgsConstructor
public class EmailController {

    private final ProfileService profileService;
    private final IncomeService incomeService;
    private final ExpenseService expenseService;
    private final EmailService emailService;

    @GetMapping("/income-excel")
    public ResponseEntity<?> sendIncomeEmail() {
        ProfileEntity profile = profileService.getCurrentProfile();
        List<IncomeDTO> incomes = incomeService.getAllIncomesForCurrentUser();
        String body = buildIncomeEmailBody(profile.getFullName(), incomes);
        emailService.sendEmail(profile.getEmail(), "Your Money Manager Income Summary", body);
        return ResponseEntity.ok().body("Income email sent successfully.");
    }

    @GetMapping("/expense-excel")
    public ResponseEntity<?> sendExpenseEmail() {
        ProfileEntity profile = profileService.getCurrentProfile();
        List<ExpenseDTO> expenses = expenseService.getAllExpensesForCurrentUser();
        String body = buildExpenseEmailBody(profile.getFullName(), expenses);
        emailService.sendEmail(profile.getEmail(), "Your Money Manager Expense Summary", body);
        return ResponseEntity.ok().body("Expense email sent successfully.");
    }

    private String buildIncomeEmailBody(String fullName, List<IncomeDTO> incomes) {
        StringBuilder body = new StringBuilder();
        body.append("<p>Hi ").append(fullName).append(",</p>");
        body.append("<p>Here is your income summary from Money Manager:</p>");

        if (incomes.isEmpty()) {
            body.append("<p><strong>No income records found.</strong></p>");
        } else {
            body.append("<table style='border-collapse:collapse;width:100%;'>");
            body.append("<tr style='background-color:#f2f2f2;'><th style='border:1px solid #ddd;padding:8px;'>S.No</th>");
            body.append("<th style='border:1px solid #ddd;padding:8px;'>Name</th>");
            body.append("<th style='border:1px solid #ddd;padding:8px;'>Category</th>");
            body.append("<th style='border:1px solid #ddd;padding:8px;'>Amount</th>");
            body.append("<th style='border:1px solid #ddd;padding:8px;'>Date</th></tr>");

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            int index = 1;
            for (IncomeDTO income : incomes) {
                body.append("<tr>");
                body.append("<td style='border:1px solid #ddd;padding:8px;'>").append(index++).append("</td>");
                body.append("<td style='border:1px solid #ddd;padding:8px;'>").append(safe(income.getName())).append("</td>");
                body.append("<td style='border:1px solid #ddd;padding:8px;'>").append(safe(income.getCategoryName())).append("</td>");
                body.append("<td style='border:1px solid #ddd;padding:8px;'>").append(safe(income.getAmount())).append("</td>");
                body.append("<td style='border:1px solid #ddd;padding:8px;'>").append(income.getDate() != null ? income.getDate().format(formatter) : "").append("</td>");
                body.append("</tr>");
            }
            body.append("</table>");
        }

        body.append("<p>Thanks,<br/>Money Manager Team</p>");
        return body.toString();
    }

    private String buildExpenseEmailBody(String fullName, List<ExpenseDTO> expenses) {
        StringBuilder body = new StringBuilder();
        body.append("<p>Hi ").append(fullName).append(",</p>");
        body.append("<p>Here is your expense summary from Money Manager:</p>");

        if (expenses.isEmpty()) {
            body.append("<p><strong>No expense records found.</strong></p>");
        } else {
            body.append("<table style='border-collapse:collapse;width:100%;'>");
            body.append("<tr style='background-color:#f2f2f2;'><th style='border:1px solid #ddd;padding:8px;'>S.No</th>");
            body.append("<th style='border:1px solid #ddd;padding:8px;'>Name</th>");
            body.append("<th style='border:1px solid #ddd;padding:8px;'>Category</th>");
            body.append("<th style='border:1px solid #ddd;padding:8px;'>Amount</th>");
            body.append("<th style='border:1px solid #ddd;padding:8px;'>Date</th></tr>");

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            int index = 1;
            for (ExpenseDTO expense : expenses) {
                body.append("<tr>");
                body.append("<td style='border:1px solid #ddd;padding:8px;'>").append(index++).append("</td>");
                body.append("<td style='border:1px solid #ddd;padding:8px;'>").append(safe(expense.getName())).append("</td>");
                body.append("<td style='border:1px solid #ddd;padding:8px;'>").append(safe(expense.getCategoryName())).append("</td>");
                body.append("<td style='border:1px solid #ddd;padding:8px;'>").append(safe(expense.getAmount())).append("</td>");
                body.append("<td style='border:1px solid #ddd;padding:8px;'>").append(expense.getDate() != null ? expense.getDate().format(formatter) : "").append("</td>");
                body.append("</tr>");
            }
            body.append("</table>");
        }

        body.append("<p>Thanks,<br/>Money Manager Team</p>");
        return body.toString();
    }

    private String safe(Object value) {
        return value != null ? String.valueOf(value) : "";
    }
}
