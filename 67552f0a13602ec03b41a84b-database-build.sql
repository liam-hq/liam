/*
Q.
The health insurance company has multiple insurance agents, each with a unique Agent ID, Name, Hire Date, and Contact Phone. An agent can handle health insurance business for multiple customers. Each customer has a Customer ID, Name, ID Card Number, and Contact Phone. Each insurance policy has a unique Policy ID, Insurance Type (Inpatient, Outpatient, Critical Illness), Insured Amount, Insurance Term, and Premium. Each payment requires recording the Payment Amount, Payment Date, and Payment Method. In addition, the insurance company needs to record each customer's Medical Records and Claim Records. --- Physical-design workload & constraints --- • Current scale: ~100 k customers, ~250 k active policies, growing 10 % / year. • Read : Write ≈ 90 : 10 (customer self-service portal)。 • Hot queries: 1. Lookup customer by **ID Card Number** to show profile (P99 < 100 ms). 2. List all **policies for a customer** (P99 < 150 ms). 3. Agents list their own **policies** (pagination, P95 < 200 ms). 4. Show **payment history** for a policy, ordered by date (P99 < 120 ms). 5. Display customer's **last 3 medical visits** (P95 < 120 ms). • Peak traffic: 300 read-QPS / 30 write-QPS. • DB: PostgreSQL 16, SSD (≈ 6000 IOPS)。
*/


/*
A.
The database schema for the health insurance company has been successfully created with the following tables:

Agents: Stores information about insurance agents, including their unique Agent ID, Name, Hire Date, and Contact Phone.

Customers: Contains customer details such as Customer ID, Name, ID Card Number, and Contact Phone.

Policies: Records each insurance policy with details like Policy ID, Insurance Type, Insured Amount, Insurance Term, Premium, and references to the customer and agent.

Payments: Logs payment details including Payment Amount, Payment Date, Payment Method, and the associated Policy ID.

Medical Records: Keeps track of each customer's medical visits with Visit Date and Details.

Claim Records: Documents claims made by customers, including Claim Date, Claim Amount, and Status.

Indexes have been created to optimize the performance of the hot queries, ensuring efficient lookups and retrievals.
*/


-- Migrations will appear here as you chat with AI

create table agents (
  id bigint primary key generated always as identity,
  agent_id text unique not null,
  name text not null,
  hire_date date not null,
  contact_phone text not null
);

create table customers (
  id bigint primary key generated always as identity,
  customer_id text unique not null,
  name text not null,
  id_card_number text unique not null,
  contact_phone text not null
);

create table policies (
  id bigint primary key generated always as identity,
  policy_id text unique not null,
  insurance_type text check (
    insurance_type in ('Inpatient', 'Outpatient', 'Critical Illness')
  ) not null,
  insured_amount numeric not null,
  insurance_term text not null,
  premium numeric not null,
  customer_id bigint references customers (id) on delete cascade,
  agent_id bigint references agents (id) on delete set null
);

create table payments (
  id bigint primary key generated always as identity,
  payment_amount numeric not null,
  payment_date date not null,
  payment_method text not null,
  policy_id bigint references policies (id) on delete cascade
);

create table medical_records (
  id bigint primary key generated always as identity,
  customer_id bigint references customers (id) on delete cascade,
  visit_date date not null,
  details text
);

create table claim_records (
  id bigint primary key generated always as identity,
  customer_id bigint references customers (id) on delete cascade,
  claim_date date not null,
  claim_amount numeric not null,
  status text not null
);

create index idx_customers_id_card_number on customers using btree (id_card_number);

create index idx_policies_customer_id on policies using btree (customer_id);

create index idx_policies_agent_id on policies using btree (agent_id);

create index idx_payments_policy_id on payments using btree (policy_id);

create index idx_medical_records_customer_id on medical_records using btree (customer_id);

create index idx_claim_records_customer_id on claim_records using btree (customer_id);
