//package in.anuj.moneymanager.controller;
//
//import in.anuj.moneymanager.service.ExcelService;
//import in.anuj.moneymanager.service.ExpenseService;
//import in.anuj.moneymanager.service.IncomeService;
//import org.junit.jupiter.api.Test;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
//import org.springframework.boot.test.mock.mockito.MockBean;
//import org.springframework.test.web.servlet.MockMvc;
//
//import java.io.OutputStream;
//import java.nio.charset.StandardCharsets;
//import java.util.List;
//
//import static org.mockito.ArgumentMatchers.any;
//import static org.mockito.ArgumentMatchers.anyList;
//import static org.mockito.BDDMockito.given;
//import static org.mockito.Mockito.doAnswer;
//import static org.mockito.Mockito.never;
//import static org.mockito.Mockito.verify;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
//
//@WebMvcTest(ExcelController.class)
//class ExcelControllerTest {
//
//    @Autowired
//    private MockMvc mockMvc;
//
//    @MockBean
//    private ExcelService excelService;
//
//    @MockBean
//    private IncomeService incomeService;
//
//    @MockBean
//    private ExpenseService expenseService;
//
//    @Test
//    void downloadIncomeByTypeRouteUsesIncomeExport() throws Exception {
//        given(incomeService.getCurrentMonthIncomesForCurrentUser()).willReturn(List.of());
//        doAnswer(invocation -> {
//            OutputStream os = invocation.getArgument(0);
//            os.write("income".getBytes(StandardCharsets.UTF_8));
//            return null;
//        }).when(excelService).writeIncomesToExcel(any(OutputStream.class), anyList());
//
//        mockMvc.perform(get("/excel/download/{type}", "income"))
//                .andExpect(status().isOk())
//                .andExpect(header().string("Content-Disposition", "attachment; filename=income.xlsx"));
//
//        verify(excelService).writeIncomesToExcel(any(OutputStream.class), anyList());
//        verify(excelService, never()).writeExpensesToExcel(any(OutputStream.class), anyList());
//    }
//}
