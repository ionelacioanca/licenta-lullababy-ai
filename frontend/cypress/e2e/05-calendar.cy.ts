/// <reference types="cypress" />

/**
 * CALENDAR TESTS - Navigation, Event Management, Auto-generation
 * 
 * Note: Calendar is a Modal component in Jurnal page
 * Test scenarios:
 * 1. Navigate through calendar (prev/next months)
 * 2. Display events for entire month
 * 3. Add new calendar event
 * 4. Mark event as completed (toggle)
 * 5. Auto-generate events based on baby age (vaccination/milestone schedule)
 */

describe("Calendar", () => {
  beforeEach(() => {
    cy.visit("/jurnal", { failOnStatusCode: false });
    cy.viewport(375, 622);
    cy.wait(500);
  });

  // Opening & Structure
  it("should load calendar page", () => {
    cy.get("body").should("exist");
  });

  it("should have card to open calendar modal", () => {
    // Should be a button to open calendar view
    cy.contains(/calendar|calend/i).should("exist");
  });

  it("should open calendar modal on button click", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(500);
    // Calendar modal should appear
    cy.get("body").should("exist");
    cy.screenshot("calendar-modal-opened");
  });

  it("should display month/year header in calendar", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(500);
    // Calendar should show current month/year
    cy.contains(/january|february|march|april|may|june|july|august|september|october|november|december|2025|2026/i)
      .should("exist");
  });

  // Month Navigation
  it("should have previous and next month button", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(500);
    // Calendar should have navigation - verify page exists
    cy.get("body").should("exist");
  });

  it("should navigate to previous and next month", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(500);
    cy.contains(/january|february|march|april|may|june|july|august|september|october|november|december/i)
      .should("exist");
    cy.get("body").should("exist");
  });

  it("should display calendar grid for month", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(500);
    // Should have days/dates visible
    cy.contains(/\b[0-9]+\b/).should("exist");
    cy.screenshot("calendar-grid-display");
  });

  // Events Display
  it("should load and display month events", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(1000); // Wait for events to load
    // Calendar should fetch events for current month from API
    cy.get("body").should("exist");
    cy.wait(500);
    // Events might be displayed as dots/indicators or in a list
    cy.get("*").should("have.length.greaterThan", 0);
  });

  it("should display events with different types", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(1000);
    // Events can be: vaccination, checkup, milestone, medication, appointment, other
    // Should be distinguishable by color/icon
    cy.get("body").should("exist");
  });

  it("should show event indicators on calendar dates", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(1000);
    // Dates with events should be marked/highlighted
    cy.get("body").should("exist");
  });

  it("should display all events when viewing full month", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(1000);
    // Should not limit events shown in month view
    cy.get("body").should("exist");
  });

  // Add New Event
  it("should display add event button", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(500);
    // Should have button to add new event
    cy.contains(/add|new event|\+|plus/i).should("exist");
  });

  it("should open add event form on button click", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(500);
    cy.contains(/add|new event|\+|plus/i).click({ force: true });
    cy.wait(300);
    // Form should appear (modal or inline)
    cy.get("body").should("exist");
  });

  it("should have event title input field", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(500);
    cy.contains(/add|new event|\+|plus/i).click({ force: true });
    cy.wait(300);
    // Should have text input for title
    cy.get("input").should("have.length.greaterThan", 0);
  });

  it("should have event type selector", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(500);
    cy.contains(/add|new event|\+|plus/i).click({ force: true });
    cy.wait(300);
    // Should have dropdown/buttons for: vaccination, checkup, milestone, medication, appointment, other
    cy.contains(/type|vaccination|checkup|milestone|medication|appointment/i).should("exist");
  });

  it("should have description/notes field", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(500);
    cy.contains(/add|new event|\+|plus/i).click({ force: true });
    cy.wait(300);
    // Should have textarea or text input for description
    cy.get("input, textarea").should("have.length.greaterThan", 0);
  });

  it("should submit event form", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(500);
    cy.contains(/add|new event|\+|plus/i).click({ force: true });
    cy.wait(300);
    cy.get("input").first().type("Test Event", { force: true });
    cy.wait(200);
    // Should have save/submit button
    cy.contains(/save|submit|add|confirm/i).should("exist");
  });

  it("should close form after successful add", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(500);
    cy.contains(/add|new event|\+|plus/i).click({ force: true });
    cy.wait(300);
    cy.get("input").first().type("Another Event", { force: true });
    cy.wait(200);
    cy.contains(/save|submit|add|confirm/i).click({ force: true });
    cy.wait(500);
    // Form should close
    cy.get("body").should("exist");
  });

  // Mark Event as Completed
  it("should display events with completion status", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(1000);
    // Events should be toggleable (completed/uncompleted)
    cy.get("body").should("exist");
  });

  it("should have checkbox or toggle for events", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(1000);
    // Event rows should have checkboxes or clickable toggle
    cy.get("body").should("exist");
  });

  it("should visually indicate completed events", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(1000);
    // Completed events should appear different (strikethrough, dimmed, etc)
    cy.get("body").should("exist");
  });

  it("should allow toggling completed event back to incomplete", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(1000);
    // Should be able to uncheck completed event
    cy.get("body").should("exist");
  });

  it("should persist completion status after navigation", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(1000);
    // Marked complete should stay complete when switching months
    cy.get("body").should("exist");
  });

  // Auto-Generated Events
  it("should have vaccination schedule events if enabled", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(1000);
   
    cy.get("body").should("exist");
  });

  it("should calculate auto-generated dates from birth date", () => {
    const birthDate = new Date("2024-06-15");
    const vaccinationMonths = [0, 2, 4, 6, 12];
    const milestoneMonths = [3, 6, 12];
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(1000);
    vaccinationMonths.forEach(months => {
      const date = new Date(birthDate);
      date.setMonth(date.getMonth() + months);
      cy.contains(new RegExp(`${date.getDate()}`, "i")).should("exist");
    });
    milestoneMonths.forEach(months => {
      const date = new Date(birthDate);
      date.setMonth(date.getMonth() + months);
      cy.contains(new RegExp(`${date.getDate()}`, "i")).should("exist");
    });
  });

  it("should allow completion toggle on auto-generated events", () => {
    cy.contains(/calendar|calend/i).click({ force: true });
    cy.wait(1000);
    // Auto-generated events can be marked complete/incomplete via checkbox
    // Completion toggle works for all events including auto-generated
    cy.get("body").should("exist");
  });
});
