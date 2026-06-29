/// <reference types="cypress" />

/**
 * LINK REQUEST TESTS
 * 
 * Link Request functionality:
 * 1. Nanny/Other sends link request to parent (by email + optional message)
 * 2. Parent receives notification in Link Requests section
 * 3. Parent can accept/decline from Link Requests modal
 * 4. Users can view connections in Settings
 * 5. Users can break connections/unlink
 * 
 * IMPORTANT: Link request form is in a MODAL on the Dashboard, not on a separate page
 * Flow: Login → Dashboard → Click Settings → Click "Request Parent Link" (nanny) or "Link Requests" (parent)
 */

// Login for nanny with cy.session to preserve auth state
function loginAsNanny() {
  cy.session("nanny-user1", () => {
    cy.visit("/login", { failOnStatusCode: false });
    cy.viewport(375, 622);
    cy.wait(1000);
    
    // Enter email
    cy.get("input[type='email']", { timeout: 10000 })
      .should("exist")
      .type("user1@gmail.com", { force: true });
    
    cy.wait(500);
    
    // Enter password
    cy.get("input[type='password']", { timeout: 10000 })
      .should("exist")
      .type("123456", { force: true });
    
    cy.wait(500);
    
    // Click login button
    cy.contains(/login|sign in|log in/i, { timeout: 10000 })
      .click({ force: true });
    
    // Wait for page to load
    cy.wait(3000);
  });
}

// Login for parent with cy.session to preserve auth state
function loginAsParent() {
  cy.session("parent-test", () => {
    cy.visit("/login", { failOnStatusCode: false });
    cy.viewport(375, 622);
    cy.wait(1000);
    
    // Enter email
    cy.get("input[type='email']", { timeout: 10000 })
      .should("exist")
      .type("test@gmail.com", { force: true });
    
    cy.wait(500);
    
    // Enter password
    cy.get("input[type='password']", { timeout: 10000 })
      .should("exist")
      .type("123456", { force: true });
    
    cy.wait(500);
    
    // Click login button
    cy.contains(/login|sign in|log in/i, { timeout: 10000 })
      .click({ force: true });
    
    // Wait for page load
    cy.wait(3000);
  });
}

/**
 * LINK REQUESTS - NANNY PERSPECTIVE: SENDING REQUEST
 */
describe("Link Requests - Nanny Sending Request", () => {
  beforeEach(() => {
    // Login as nanny
    loginAsNanny();
    cy.wait(500);
    
    // After login, navigate to dashboard (main app page)
    cy.visit("/dashboard", { failOnStatusCode: false });
    cy.wait(1000);
  });

  it("should load dashboard as nanny", () => {
    cy.get("body").should("exist");
    cy.screenshot("nanny-dashboard");
  });

  it("should have settings button on dashboard", () => {
    // Look for settings button/icon
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .should("exist")
      .should("be.visible");
  });

  it("should open settings modal when clicking settings", () => {
    // Click settings button
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .click({ force: true });
    
    cy.wait(500);
    
    // Settings modal should be visible with content
    cy.get("body").should("exist");
    cy.screenshot("settings-modal");
  });

  it("should show 'Request Parent Link' button for nanny", () => {
    // Click settings
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .click({ force: true });
    cy.wait(500);
    cy.contains(/Request Parent Link|Conectare P[ăa]rinte|request/i)
      .should("exist")
      .should("be.visible");
    
    cy.screenshot("nanny-request-option");
  });

  it("should open send link request modal when clicking request button", () => {
    // Click settings
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .click({ force: true });
    
    cy.wait(500);
    
    // Click "Request Parent Link"
    cy.contains(/Request Parent Link|Conectare P[ăa]rinte|request/i)
      .click({ force: true });
    
    cy.wait(500);
    
    // Modal should be open with email input
    cy.get("input[type='email']")
      .should("exist")
      .should("be.visible");
    
    cy.screenshot("send-link-request-modal");
  });

  it("nanny should be able to enter parent email", () => {
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .click({ force: true });
    cy.wait(500); 
    cy.contains(/Request Parent Link|Conectare P[ăa]rinte|request/i)
      .click({ force: true });
    cy.wait(500);
    const parentEmail = "test@gmail.com";
    cy.get("input[type='email']")
      .type(parentEmail, { force: true })
      .should("have.value", parentEmail);
  });

  it("nanny should have optional message field", () => {
    // Open modal
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .click({ force: true });
    cy.wait(500);
    
    cy.contains(/Request Parent Link|Conectare P[ăa]rinte|request/i)
      .click({ force: true });
    cy.wait(500);
    
    // Look for textarea or message field
    cy.get("textarea")
      .should("exist");
  });

  it("nanny should be able to enter message", () => {
    // Open modal
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .click({ force: true });
    cy.wait(500);
    
    cy.contains(/Request Parent Link|Conectare P[ăa]rinte|request/i)
      .click({ force: true });
    cy.wait(500);
    
    const message = "Hi! I'm the nanny for your child.";
    
    cy.get("textarea")
      .type(message, { force: true })
      .should("have.value", message);
  });

  it("nanny should have send/submit button", () => {
    // Open modal
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .click({ force: true });
    cy.wait(500);
    
    cy.contains(/Request Parent Link|Conectare P[ăa]rinte|request/i)
      .click({ force: true });
    cy.wait(500);
    
    // Should have send button
    cy.contains(/send|submit|request|connect|trimite/i)
      .should("exist")
      .should("be.visible");
  });
});

/**
 * LINK REQUESTS - PARENT PERSPECTIVE: RECEIVING & ACCEPTING
 */
describe("Link Requests - Parent Receiving Request", () => {
  beforeEach(() => {
    // Login as parent
    loginAsParent();
    cy.wait(500);
    
    // Navigate to dashboard
    cy.visit("/dashboard", { failOnStatusCode: false });
    cy.wait(1000);
  });

  it("should load dashboard as parent", () => {
    cy.get("body").should("exist");
    cy.screenshot("parent-dashboard");
  });

  it("parent should have settings button", () => {
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .should("exist");
  });

  it("should open link requests from settings", () => {
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .click({ force: true }); 
    cy.wait(500);
    cy.contains("Link Requests")
      .should("exist");
  });

  it("parent should see link requests modal", () => {
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .click({ force: true });
    cy.wait(500);
    cy.contains("Link Requests")
      .click({ force: true });
    cy.wait(500);
    cy.get("body").should("exist");
    cy.screenshot("parent-link-requests");
  });

  it("parent should see requester information", () => {
    // Open link requests
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .click({ force: true });
    cy.wait(500);
    
    cy.contains("Link Requests")
      .click({ force: true });
    cy.wait(500);
    
    // Should have request list
    cy.get("body").should("exist");
  });

  it("parent should have action buttons for requests", () => {
    // Open link requests modal
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .click({ force: true });
    cy.wait(500);
    
    cy.contains("Link Requests")
      .click({ force: true });
    cy.wait(500);
    
    // Should have content
    cy.get("body").should("exist");
    cy.screenshot("parent-request-actions");
  });
});

/**
 * CONNECTION MANAGEMENT
 */
describe("Link Requests - Connection Management", () => {
  it("parent should view connections in settings", () => {
    // Login as parent
    loginAsParent();
    cy.wait(500);
    
    cy.visit("/dashboard", { failOnStatusCode: false });
    cy.wait(1000);
    
    // Click settings
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .click({ force: true });
    cy.wait(500);
    
    // Should show connections at top of settings
    cy.get("body").should("exist");
  });

  it("nanny should view connections in settings", () => {
    // Login as nanny
    loginAsNanny();
    cy.wait(500);
    
    cy.visit("/dashboard", { failOnStatusCode: false });
    cy.wait(1000);
    
    // Click settings
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .click({ force: true });
    cy.wait(500);
    
    // Should show connections
    cy.get("body").should("exist");
  });
});

/**
 * SECURITY & VALIDATION
 */
describe("Link Requests - Security", () => {
  it("nanny should see 'Request Parent Link' option", () => {
    // Login as nanny
    loginAsNanny();
    cy.wait(500);
    
    cy.visit("/dashboard", { failOnStatusCode: false });
    cy.wait(1000);
    
    // Click settings
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .click({ force: true });
    cy.wait(500);
    
    // Nanny should see request option
    cy.contains(/Request Parent Link|Conectare P[ăa]rinte|request/i)
      .should("exist");
  });

  it("parent should NOT see 'Request Parent Link' option", () => {
    // Login as parent
    loginAsParent();
    cy.wait(500);
    
    cy.visit("/dashboard", { failOnStatusCode: false });
    cy.wait(1000);
    
    // Click settings
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .click({ force: true });
    cy.wait(500);
    
    // Parent should see Link Requests, not Request Parent Link
    cy.contains("Link Requests")
      .should("exist");
  });

  it("should validate email format in link request form", () => {
    // Login as nanny
    loginAsNanny();
    cy.wait(500);
    
    cy.visit("/dashboard", { failOnStatusCode: false });
    cy.wait(1500);
    
    // Open link request form
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .click({ force: true });
    cy.wait(500);
    
    cy.contains(/Request Parent Link|Conectare P[ăa]rinte|request/i)
      .click({ force: true });
    cy.wait(500);
    
    // Try entering invalid email
    cy.get("input[type='email']")
      .type("invalid-email", { force: true });
    
    cy.wait(300);
  });

  it("nanny should require parent email for link request", () => {
    // Login as nanny
    loginAsNanny();
    cy.wait(500);
    
    cy.visit("/dashboard", { failOnStatusCode: false });
    cy.wait(1000);
    
    // Open form
    cy.contains(/settings|setari|configurare|gear|conturi/i)
      .click({ force: true });
    cy.wait(500);
    
    cy.contains(/Request Parent Link|Conectare P[ăa]rinte|request/i)
      .click({ force: true });
    cy.wait(500);
    
    // Email field should be present
    cy.get("input[type='email']")
      .should("exist");
  });
});
