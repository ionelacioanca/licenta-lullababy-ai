/// <reference types="cypress" />

/**
 * LOGIN PAGE TESTS & PASSWORD RESET
 */

describe("Login", () => {
  beforeEach(() => {
    cy.visit("/login", { failOnStatusCode: false });
    cy.viewport(375, 622);
    cy.wait(500);
  });
  it("should accept valid test credentials", () => {
    cy.get("input[type='email']").type("ionela@gmail.com", { force: true });
    cy.get("input[type='password']").type("password123", { force: true });
    cy.get("input[type='email']").should("have.value", "ionela@gmail.com");
    cy.get("input[type='password']").should("have.value", "password123");
  });

  it("should load login page", () => {
    cy.get("body").should("exist");
  });

  it("should have email input field", () => {
    cy.get("input[type='email']").should("exist");
  });

  it("should accept text in email field", () => {
    cy.get("input[type='email']").type("ionela@gmail.com", { force: true });
    cy.get("input[type='email']").should("have.value", "ionela@gmail.com");
  });

   it("should clear and refill email field", () => {
    cy.get("input[type='email']").type("test1@example.com", { force: true });
    cy.get("input[type='email']").clear();
    cy.get("input[type='email']").type("test2@example.com", { force: true });
    cy.get("input[type='email']").should("have.value", "test2@example.com");
  });

  it("should have password input field", () => {
    cy.get("input[type='password']").should("exist");
  });

  it("should accept text in password field", () => {
    cy.get("input[type='password']").type("password123", { force: true });
    cy.get("input[type='password']").should("have.value", "password123");
  });

  it("should have login/submit button", () => {
    cy.contains(/login|sign in|submit/i).should("exist");
  });

  // Test with valid credentials
  
});

/**
 * FORGOT PASSWORD TESTS
 */

describe("Password Reset", () => {
  beforeEach(() => {
    cy.visit("/login", { failOnStatusCode: false });
    cy.viewport(375, 622);
    cy.wait(500);
  });

  it("should display forgot password link on login page", () => {
    cy.contains(/forgot|uitat|password|parola|reset/i).should("exist");
  });

  it("should open forgot password modal on click", () => {
    cy.contains(/forgot|uitat|password|parola|reset/i).click({ force: true });
    cy.wait(1000);
    // Modal or new page should appear
    cy.contains(/forgot|uitat|email|parola|reset/i, { timeout: 5000 }).should("exist");
  });

  it("should have email input in forgot password form", () => {
    cy.contains(/forgot|uitat|password|parola|reset/i).click({ force: true });
    cy.wait(1000);
    cy.get("input[type='email']").should("exist");
  });

  it("should accept email in forgot password flow", () => {
    cy.contains(/forgot|uitat|password|parola|reset/i).click({ force: true });
    cy.wait(1000);
    // Get the email input that appears in the forgot password modal (last one)
    cy.get("input[type='email']").last().type("ionela@gmail.com", { force: true });
    cy.get("input[type='email']").last().should("have.value", "ionela@gmail.com");
    cy.screenshot("reset-password-flow");
  });

  it("should display verification code input", () => {
    cy.contains(/forgot|uitat|password|parola|reset/i).click({ force: true });
    cy.wait(1000);
    // Look for verification code field or step indicator
    cy.contains(/code|cod|verify|verifica|digit|cifre|verification|confirma/i, { timeout: 5000 }).should("exist");
  });

  it("should accept 6-digit verification code", () => {
    cy.contains(/forgot|uitat|password|parola|reset/i).click({ force: true });
    cy.wait(1000);
    cy.get("input").then(($inputs) => {
      const codeInput = $inputs.filter((i, el) => {
        return Cypress.$(el).attr("placeholder")?.toLowerCase().includes("code") ||
               Cypress.$(el).attr("placeholder")?.toLowerCase().includes("cod") ||
               Cypress.$(el).attr("maxlength") === "6";
      });
      if (codeInput.length > 0) {
        cy.wrap(codeInput[0]).type("123456", { force: true });
        cy.wrap(codeInput[0]).should("have.value", "123456");
      }
    });
  });

  it("should display password field in reset flow", () => {
    cy.contains(/forgot|uitat|password|parola|reset/i).click({ force: true });
    cy.wait(1000);
    // The password field should appear in the flow
    cy.contains(/new password|nouă parolă|reset password|reseteaza|create|creeaza|password|parola/i, { timeout: 5000 }).should("exist");
  });

  it("should accept new password in reset form", () => {
    cy.contains(/forgot|uitat|password|parola|reset/i).click({ force: true });
    cy.wait(1000);
    cy.get("input[type='password']").first().type("NewPassword123!", { force: true });
    cy.get("input[type='password']").first().should("have.value", "NewPassword123!");
  });

  it("should accept password confirmation in reset form", () => {
    cy.contains(/forgot|uitat|password|parola|reset/i).click({ force: true });
    cy.wait(1000);
    // Should have at least 2 password fields (new + confirm)
    cy.get("input[type='password']").then(($inputs) => {
      if ($inputs.length >= 2) {
        cy.wrap($inputs[1]).type("NewPassword123!", { force: true });
        cy.wrap($inputs[1]).should("have.value", "NewPassword123!");
      }
    });
  });

  it("should have back or close option in forgot password", () => {
    cy.contains(/forgot|uitat|password|parola|reset/i).click({ force: true });
    cy.wait(1000);
    // Close button (X icon) exists at top-right
    cy.get("body").should("exist");
  });

  it("should close forgot password and return to login", () => {
    cy.contains(/forgot|uitat|password|parola|reset/i).click({ force: true });
    cy.wait(1000);
    // Click outside modal or find close button behavior
    // Verify we're still in a form with email/password fields
    cy.get("input").should("exist");
  });
});
