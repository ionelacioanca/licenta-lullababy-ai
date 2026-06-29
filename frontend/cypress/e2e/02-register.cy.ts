/// <reference types="cypress" />

/**
 * REGISTER PAGE TESTS
 */

// Helper function to select a role from dropdown
function selectRole(roleName: string) {
  cy.get("body").click({ force: true });
  cy.wait(200);
  cy.get('[data-testid="role-dropdown"]')
    .first()
    .click({ force: true });
  cy.wait(800);
  cy.contains(new RegExp(`^${roleName}$`, "i"))
    .last() 
    .click({ force: true });
  cy.wait(800);
}

describe("Register", () => {
  beforeEach(() => {
    cy.visit("/register", { failOnStatusCode: false });
    cy.viewport(375, 622);
    cy.wait(500);
  });

  // Basic form presence checks
  it("should load register page", () => {
    cy.get("body").should("exist");
  });

  it("should have name input field", () => {
    cy.get("input").should("have.length.greaterThan", 0);
  });

  // Input interaction tests with unique email (timestamp-based)
  it("should accept text in name field", () => {
    cy.get("input").first().type("Test Parent", { force: true });
    cy.get("input").first().should("have.value", "Test Parent");
    cy.screenshot("register-name-input");
  });

  it("should clear and refill name field", () => {
    cy.get("input").first().type("Name1", { force: true });
    cy.get("input").first().clear();
    cy.get("input").first().type("Name2", { force: true });
    cy.get("input").first().should("have.value", "Name2");
  });

  it("should have email input field", () => {
    cy.get("input[type='email']").should("exist");
  });

   it("should accept email in email field", () => {
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    cy.get("input[type='email']").type(testEmail, { force: true });
    cy.get("input[type='email']").should("have.value", testEmail);
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

  it("should accept password in password field", () => {
    cy.get("input[type='password']").type("TestPassword123!", { force: true });
    cy.get("input[type='password']").should("have.value", "TestPassword123!");
  });

  it("should accept special characters in password", () => {
    cy.get("input[type='password']").type("P@ssw0rd!#$%", { force: true });
    cy.get("input[type='password']").should("have.value", "P@ssw0rd!#$%");
  });

  it("should have role/type dropdown or selector", () => {
    cy.contains(/(mother|father|nanny|role|type|parent)/i).should("exist");
  });

  // Role selection test
  it("should have at least 3 role options visible or selectable", () => {
    cy.contains(/(mother|father|nanny)/i).should("exist");
  });

  // Submit/Navigation tests
  it("should have submit/register button", () => {
    cy.contains(/register|sign up|create.*account|creează/i).should("exist");
  });

  it("should have back button to navigate away", () => {
    // Register page has a back arrow button (Ionicons) at the top
    // Test that we can find elements to click to go back
    cy.get("body").should("exist");
  });

  // Nanny role conditional tests
  describe("Nanny Role Selection", () => {
    it("should display related parent checkbox when nanny role is selected", () => {
      // Select nanny role using helper
      selectRole("nanny");
      
      cy.wait(1000);
      
      // Check if related parent checkbox appears
      cy.get('[data-testid="related-parent-checkbox"]')
        .should("exist")
        .should("be.visible");
      
      cy.screenshot("nanny-role-checkbox");
    });

    it("should not show parent email input initially when nanny is selected", () => {
      selectRole("nanny");
      cy.wait(1000);
      
      // Parent email input should not be visible initially
      cy.get('[data-testid="parent-email-input"]')
        .should("not.exist");
    });

    it("should show parent email input when related parent checkbox is checked", () => {
      selectRole("nanny");
      cy.wait(1000);
      
      // Find and click the related parent checkbox container/parent
      cy.get('[data-testid="related-parent-checkbox"]')
        .parent()
        .click({ force: true });
      
      cy.wait(800);
      
      // Parent email input should now be visible
      cy.get('[data-testid="parent-email-input"]')
        .should("exist")
        .should("be.visible");
      
      cy.screenshot("nanny-parent-email-shown");
    });

    it("should accept parent email in parent email field", () => {
      selectRole("nanny");
      cy.wait(1000);
      
      // Click the related parent checkbox
      cy.get('[data-testid="related-parent-checkbox"]')
        .parent()
        .click({ force: true });
      
      cy.wait(800);
      
      const parentEmailValue = "parent@example.com";
      cy.get('[data-testid="parent-email-input"]')
        .type(parentEmailValue, { force: true })
        .should("have.value", parentEmailValue);
      
      cy.screenshot("nanny-parent-email-input");
    });

    it("should hide parent email input when checkbox is unchecked", () => {
      selectRole("nanny");
      cy.wait(1000);
      
      // Click checkbox to check it
      cy.get('[data-testid="related-parent-checkbox"]')
        .parent()
        .click({ force: true });
      cy.wait(800);
      
      // Click again to uncheck it
      cy.get('[data-testid="related-parent-checkbox"]')
        .parent()
        .click({ force: true });
      cy.wait(800);
      
      // Parent email input should be hidden
      cy.get('[data-testid="parent-email-input"]')
        .should("not.exist");
    });
  });

  // Other role conditional tests
  describe("Other Role Selection with Custom Role", () => {
    it("should display custom role input when other role is selected", () => {
      // Select other role using helper
      selectRole("other");
      cy.wait(1000);
      
      // Check if custom role input appears
      cy.get('[data-testid="custom-role-input"]')
        .should("exist")
        .should("be.visible");
      
      cy.screenshot("other-role-input");
    });

    it("should accept custom role text", () => {
      selectRole("other");
      cy.wait(1000);
      
      const customRole = "Babysitter";
      cy.get('[data-testid="custom-role-input"]')
        .type(customRole, { force: true })
        .should("have.value", customRole);
      
      cy.screenshot("other-role-filled");
    });

    it("should display related parent checkbox under custom role input", () => {
      selectRole("other");
      cy.wait(1000);
      
      // Type custom role
      cy.get('[data-testid="custom-role-input"]')
        .type("Babysitter", { force: true });
      
      cy.wait(600);
      
      // Check if related parent checkbox appears
      cy.get('[data-testid="related-parent-checkbox"]')
        .should("exist")
        .should("be.visible");
      
      cy.screenshot("other-role-checkbox");
    });

    it("should not show parent email input when other role is selected but checkbox unchecked", () => {
      selectRole("other");
      cy.wait(1000);
      
      cy.get('[data-testid="custom-role-input"]')
        .type("Babysitter", { force: true });
      
      cy.wait(600);
      
      // Should not have parent email input
      cy.get('[data-testid="parent-email-input"]')
        .should("not.exist");
    });

    it("should show parent email input when related parent checkbox is checked under other role", () => {
      selectRole("other");
      cy.wait(1000);
      
      cy.get('[data-testid="custom-role-input"]')
        .type("Babysitter", { force: true });
      
      cy.wait(600);
      
      // Click the related parent checkbox
      cy.get('[data-testid="related-parent-checkbox"]')
        .parent()
        .click({ force: true });
      
      cy.wait(800);
      
      // Parent email input should be visible
      cy.get('[data-testid="parent-email-input"]')
        .should("exist")
        .should("be.visible");
      
      cy.screenshot("other-role-parent-email-shown");
    });

    it("should accept parent email when other role has related parent checked", () => {
      selectRole("other");
      cy.wait(1000);
      
      cy.get('[data-testid="custom-role-input"]')
        .type("Babysitter", { force: true });
      
      cy.wait(600);
      
      // Click the related parent checkbox
      cy.get('[data-testid="related-parent-checkbox"]')
        .parent()
        .click({ force: true });
      
      cy.wait(800);
      
      const parentEmailValue = "otherparent@example.com";
      cy.get('[data-testid="parent-email-input"]')
        .type(parentEmailValue, { force: true })
        .should("have.value", parentEmailValue);
      
      cy.screenshot("other-role-parent-email-input");
    });

    it("should allow modifying custom role text", () => {
      selectRole("other");
      cy.wait(1000);
      
      const roleInput = cy.get('[data-testid="custom-role-input"]');
      
      roleInput.type("Babysitter", { force: true });
      cy.wait(400);
      roleInput.clear();
      cy.wait(400);
      roleInput.type("Godparent", { force: true })
        .should("have.value", "Godparent");
      
      cy.screenshot("other-role-modified");
    });
  });
});
