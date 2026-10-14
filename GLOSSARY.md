# CommonCount

CommonCount helps groups record and split expenses among a shared roster of participants.

## Language

**Group Member**:
A named participant in a group's expense roster. A Group Member exists independently of an app user account and may later be associated with one.
_Avoid_: User, account

**Expense**:
A record of a cost incurred for a group, with a description, amount, date, and one Group Member who paid. An Expense may be shared by one or more Group Members.

**Expense Participant**:
A Group Member who is assigned a share of an Expense. The payer is not necessarily an Expense Participant.

**Expense Description**:
The human-readable label for an Expense (for example, "Dinner"). It is the canonical term for what the interface may call an expense name.
