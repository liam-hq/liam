# [Package Name] Specification

## 1. Overview
### 1.1 Purpose
<!-- Describe the primary purpose and goals of this package -->
<!-- Example: The @liam-hq/[package-name] package provides... -->

### 1.2 Scope
This package is responsible for:
<!-- List the main responsibilities and boundaries -->
<!-- Example:
- Feature A functionality
- Integration with Service B
- Data processing for Component C
-->

### 1.3 Terminology
<!-- Define key terms and concepts used in this specification -->
<!-- Example:
- **Term A**: Definition of term A
- **Term B**: Definition of term B
-->

## 2. Functional Requirements
### 2.1 Core Features
<!-- List the primary features this package must provide -->
<!-- Example:
- **Feature Name**: Description of what it does
- **Another Feature**: Description and key capabilities
-->

### 2.2 Use Cases
<!-- Describe specific scenarios where this package is used -->
<!-- Example:
1. **Use Case Name**
   - User action or trigger
   - System processes the request
   - Expected outcome
-->

### 2.3 Constraints
<!-- List technical and business constraints -->
<!-- Example:
- Must support up to X concurrent operations
- Response time must be under Y milliseconds
- Must work with browsers A, B, C
-->

## 3. Technical Specifications
### 3.1 Architecture
<!-- Describe the internal structure and organization -->
```typescript
// Example structure
package-name/
├── src/
│   ├── components/       // Component descriptions
│   ├── utils/           // Utility functions
│   ├── types/           // Type definitions
│   └── index.ts         // Main entry point
├── tests/               // Test files
└── docs/                // Documentation
```

### 3.2 Data Model
<!-- Define key interfaces, types, and data structures -->
```typescript
// Example interfaces
interface ExampleInterface {
  id: string;
  name: string;
  // Add relevant properties
}

interface AnotherInterface {
  // Define structure
}
```

### 3.3 API Specification
<!-- Document public APIs, functions, and components -->
```typescript
// Example API definitions
interface PublicAPI {
  functionName(param: Type): ReturnType;
  anotherFunction(options: Options): Promise<Result>;
}

// Component props (if applicable)
interface ComponentProps {
  // Define props
}
```

## 4. Interfaces
### 4.1 External Interfaces
<!-- Describe how this package interacts with external systems -->
<!-- Example:
- **Input**: What data/events this package receives
- **Output**: What data/events this package produces
- **Dependencies**: External services or APIs used
-->

### 4.2 Internal Interfaces
<!-- Describe interactions with other packages in the monorepo -->
<!-- Example:
- **Package A Integration**: How it connects to @liam-hq/package-a
- **Package B Integration**: Data exchange with @liam-hq/package-b
-->

### 4.3 Dependencies
<!-- List all dependencies and their purposes -->
<!-- Example:
- react: UI framework
- typescript: Type safety
- @liam-hq/ui: Shared UI components
-->

## 5. Non-functional Requirements
### 5.1 Performance
<!-- Define performance requirements and benchmarks -->
<!-- Example:
- Initial load time < 500ms
- API response time < 200ms
- Memory usage < 100MB
-->

### 5.2 Security
<!-- Outline security considerations and requirements -->
<!-- Example:
- Input validation for all user data
- Secure handling of sensitive information
- Protection against common vulnerabilities
-->

### 5.3 Scalability
<!-- Describe scalability considerations -->
<!-- Example:
- Support for increasing data volumes
- Horizontal scaling capabilities
- Performance under load
-->

## 6. Implementation Details
### 6.1 Component Design
<!-- Describe key implementation decisions and patterns -->
<!-- Example:
- Use of specific design patterns
- State management approach
- Error handling strategy
-->

### 6.2 State Management
<!-- If applicable, describe how state is managed -->
<!-- Example:
- Local component state
- Global state management
- State persistence
-->

### 6.3 Error Handling
<!-- Describe error handling approach -->
<!-- Example:
- Error types and categorization
- Error recovery mechanisms
- User-facing error messages
-->

## 7. Testing Strategy
### 7.1 Testing Priorities
<!-- Define which tests should be written first and their importance levels -->
<!-- Example:
#### 7.1.1 High Priority (Must Have)
- Critical user flows
- Data integrity tests
- Security-related functionality

#### 7.1.2 Medium Priority (Should Have)
- Error handling scenarios
- Performance edge cases
- Integration boundaries

#### 7.1.3 Low Priority (Nice to Have)
- UI visual regression
- Advanced performance optimizations
-->

### 7.2 Test Types and Coverage
<!-- Outline specific testing approaches and coverage expectations -->
<!-- Example:
- Unit tests: 80% coverage minimum
- Integration tests: Critical paths covered
- E2E tests: Main user journeys
-->

### 7.3 Validation Criteria
<!-- Define what constitutes successful testing -->
<!-- Example:
- Test coverage > 90%
- All critical paths tested
- Performance benchmarks met
-->

---

## Template Usage Notes

### How to Use This Template
1. **Copy this template** to your package directory as `SPEC.md`
2. **Replace placeholder text** with your package-specific information
3. **Remove unused sections** if they don't apply to your package
4. **Add additional sections** as needed for your specific requirements

### Section Guidelines
- **Keep it concise**: Each section should be clear and to the point
- **Use examples**: Provide code examples and concrete scenarios
- **Update regularly**: Keep the specification current with implementation
- **Link to code**: Reference actual implementation files when helpful

### Package-Specific Considerations
- **For UI packages**: Add sections for styling, accessibility, and responsive design
- **For backend packages**: Include sections for database schema, API endpoints, and authentication
- **For utility packages**: Focus on function signatures, algorithms, and performance
- **For integration packages**: Emphasize external service interactions and error handling

### Service Classification
When creating SPEC.md for packages, indicate which service(s) they support:
- **Liam ERD only**: Packages exclusively for schema visualization
- **Liam DB only**: Packages exclusively for database design and management  
- **Shared**: Packages used by both services

### Maintenance
- Review and update specifications quarterly
- Update when major features are added or changed
- Ensure alignment with actual implementation
- Gather feedback from team members using the package