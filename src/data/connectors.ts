// Static connector knowledge base for Power Automate.
// Covers the most commonly used Standard and Premium connectors.
// Source: https://learn.microsoft.com/en-us/connectors/connector-reference/

export interface ConnectorParameter {
  name: string;
  displayName: string;
  type: 'string' | 'integer' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
}

export interface ConnectorOperation {
  id: string;
  name: string;
  description: string;
  parameters?: ConnectorParameter[];
}

export type ConnectorTier = 'Standard' | 'Premium';

export interface Connector {
  id: string;
  name: string;
  description: string;
  /** Standard = included in all plans. Premium = requires Premium or higher. */
  tier: ConnectorTier;
  category: string;
  triggers?: ConnectorOperation[];
  actions: ConnectorOperation[];
}

export const CONNECTORS: Connector[] = [
  // ── Built-in / Core ──────────────────────────────────────────────────────
  {
    id: 'request',
    name: 'Request',
    description: 'Receive HTTP requests to trigger a flow; respond with HTTP responses.',
    tier: 'Standard',
    category: 'Built-in',
    triggers: [
      {
        id: 'manual',
        name: 'When an HTTP request is received',
        description: 'Triggers the flow when an HTTP POST is sent to the generated URL.',
        parameters: [
          { name: 'schema', displayName: 'Request Body JSON Schema', type: 'object', required: false, description: 'JSON schema for the expected request body' },
        ],
      },
    ],
    actions: [
      {
        id: 'Response',
        name: 'Response',
        description: 'Sends an HTTP response to the caller.',
        parameters: [
          { name: 'statusCode', displayName: 'Status Code', type: 'integer', required: true },
          { name: 'body', displayName: 'Body', type: 'object', required: false },
          { name: 'headers', displayName: 'Headers', type: 'object', required: false },
        ],
      },
    ],
  },
  {
    id: 'recurrence',
    name: 'Schedule',
    description: 'Trigger flows on a time-based schedule (recurrence or sliding window).',
    tier: 'Standard',
    category: 'Built-in',
    triggers: [
      {
        id: 'recurrence',
        name: 'Recurrence',
        description: 'Triggers the flow on a repeating schedule.',
        parameters: [
          { name: 'frequency', displayName: 'Frequency', type: 'string', required: true, description: 'Minute, Hour, Day, Week, Month' },
          { name: 'interval', displayName: 'Interval', type: 'integer', required: true },
          { name: 'startTime', displayName: 'Start Time', type: 'string', required: false },
          { name: 'timeZone', displayName: 'Time Zone', type: 'string', required: false },
        ],
      },
      {
        id: 'slidingWindow',
        name: 'Sliding Window',
        description: 'Triggers the flow to process data in contiguous time chunks from a start time.',
        parameters: [
          { name: 'frequency', displayName: 'Frequency', type: 'string', required: true },
          { name: 'interval', displayName: 'Interval', type: 'integer', required: true },
        ],
      },
    ],
    actions: [],
  },
  {
    id: 'control',
    name: 'Control',
    description: 'Built-in control actions: conditions, loops, scopes, and branching.',
    tier: 'Standard',
    category: 'Built-in',
    actions: [
      { id: 'If', name: 'Condition', description: 'Branches the flow based on a true/false condition.' },
      { id: 'Switch', name: 'Switch', description: 'Routes the flow to different cases based on a value.' },
      { id: 'Apply_to_each', name: 'Apply to each', description: 'Loops over each item in an array.' },
      { id: 'Do_until', name: 'Do until', description: 'Loops until a condition is true (or a count/timeout limit is reached).' },
      { id: 'Scope', name: 'Scope', description: 'Groups actions together for error handling (try/catch pattern).' },
      { id: 'Terminate', name: 'Terminate', description: 'Ends the flow run with Succeeded, Failed, or Cancelled status.' },
    ],
  },
  {
    id: 'variables',
    name: 'Variables',
    description: 'Initialize and modify flow variables.',
    tier: 'Standard',
    category: 'Built-in',
    actions: [
      {
        id: 'InitializeVariable',
        name: 'Initialize variable',
        description: 'Creates a new variable with a type and optional initial value. Must be the first action in a flow (not inside a loop).',
        parameters: [
          { name: 'name', displayName: 'Name', type: 'string', required: true },
          { name: 'type', displayName: 'Type', type: 'string', required: true, description: 'Boolean, Integer, Float, String, Array, Object' },
          { name: 'value', displayName: 'Value', type: 'object', required: false },
        ],
      },
      { id: 'SetVariable', name: 'Set variable', description: 'Sets the value of an existing variable.' },
      { id: 'AppendToStringVariable', name: 'Append to string variable', description: 'Appends a string value to a string variable.' },
      { id: 'AppendToArrayVariable', name: 'Append to array variable', description: 'Appends an item to an array variable.' },
      { id: 'IncrementVariable', name: 'Increment variable', description: 'Increases an integer or float variable by a specified amount.' },
      { id: 'DecrementVariable', name: 'Decrement variable', description: 'Decreases an integer or float variable by a specified amount.' },
    ],
  },
  {
    id: 'dataOperations',
    name: 'Data Operation',
    description: 'Manipulate data: compose values, parse JSON, create tables, select/filter arrays.',
    tier: 'Standard',
    category: 'Built-in',
    actions: [
      { id: 'Compose', name: 'Compose', description: 'Computes any expression or value and stores it for reuse in later actions.' },
      {
        id: 'ParseJSON',
        name: 'Parse JSON',
        description: 'Parses a JSON string into a strongly-typed object using a schema.',
        parameters: [
          { name: 'content', displayName: 'Content', type: 'string', required: true },
          { name: 'schema', displayName: 'Schema', type: 'object', required: true },
        ],
      },
      { id: 'Select', name: 'Select', description: 'Projects each element of an array into a new shape.' },
      { id: 'Filter_array', name: 'Filter array', description: 'Returns only elements of an array that satisfy a condition.' },
      { id: 'Create_CSV_table', name: 'Create CSV table', description: 'Converts an array of objects into a CSV string.' },
      { id: 'Create_HTML_table', name: 'Create HTML table', description: 'Converts an array of objects into an HTML table string.' },
      { id: 'Join', name: 'Join', description: 'Concatenates all elements in an array into a string with a delimiter.' },
    ],
  },
  {
    id: 'http',
    name: 'HTTP',
    description: 'Make arbitrary HTTP requests to any REST API or web service.',
    tier: 'Standard',
    category: 'Built-in',
    triggers: [
      {
        id: 'HttpWebhook',
        name: 'HTTP Webhook',
        description: 'Registers a callback URL with an external service to receive push events.',
      },
    ],
    actions: [
      {
        id: 'Http',
        name: 'HTTP',
        description: 'Sends an HTTP request and returns the response.',
        parameters: [
          { name: 'method', displayName: 'Method', type: 'string', required: true, description: 'GET, POST, PUT, PATCH, DELETE' },
          { name: 'uri', displayName: 'URI', type: 'string', required: true },
          { name: 'headers', displayName: 'Headers', type: 'object', required: false },
          { name: 'body', displayName: 'Body', type: 'object', required: false },
          { name: 'authentication', displayName: 'Authentication', type: 'object', required: false },
        ],
      },
    ],
  },

  // ── Microsoft 365 / Office ────────────────────────────────────────────────
  {
    id: 'office365',
    name: 'Office 365 Outlook',
    description: 'Send emails, create calendar events, and manage contacts via Office 365.',
    tier: 'Standard',
    category: 'Email & Calendar',
    triggers: [
      {
        id: 'When_a_new_email_arrives_(V3)',
        name: 'When a new email arrives (V3)',
        description: 'Triggers when a new email arrives in the specified folder.',
        parameters: [
          { name: 'folderPath', displayName: 'Folder', type: 'string', required: true },
          { name: 'to', displayName: 'To', type: 'string', required: false },
          { name: 'from', displayName: 'From', type: 'string', required: false },
          { name: 'hasAttachment', displayName: 'Has Attachment', type: 'boolean', required: false },
          { name: 'importance', displayName: 'Importance', type: 'string', required: false },
        ],
      },
      { id: 'When_a_new_email_arrives_in_a_shared_mailbox_(V2)', name: 'When a new email arrives in a shared mailbox (V2)', description: 'Triggers on new email in a shared mailbox.' },
    ],
    actions: [
      {
        id: 'SendEmailV2',
        name: 'Send an email (V2)',
        description: 'Sends an email from your Office 365 mailbox.',
        parameters: [
          { name: 'To', displayName: 'To', type: 'string', required: true },
          { name: 'Subject', displayName: 'Subject', type: 'string', required: true },
          { name: 'Body', displayName: 'Body', type: 'string', required: true },
          { name: 'Cc', displayName: 'CC', type: 'string', required: false },
          { name: 'Bcc', displayName: 'BCC', type: 'string', required: false },
          { name: 'Attachments', displayName: 'Attachments', type: 'array', required: false },
          { name: 'Importance', displayName: 'Importance', type: 'string', required: false },
        ],
      },
      { id: 'GetEmail', name: 'Get email (V2)', description: 'Gets details of an email by its ID.' },
      { id: 'ReplyTo', name: 'Reply to email (V3)', description: 'Replies to an email.' },
      { id: 'MoveEmail', name: 'Move email (V2)', description: 'Moves an email to a specified folder.' },
      { id: 'DeleteEmail', name: 'Delete email (V2)', description: 'Deletes an email.' },
      {
        id: 'CalendarPostItem',
        name: 'Create event (V4)',
        description: 'Creates a calendar event.',
        parameters: [
          { name: 'calendarId', displayName: 'Calendar ID', type: 'string', required: true },
          { name: 'subject', displayName: 'Subject', type: 'string', required: true },
          { name: 'start', displayName: 'Start Time', type: 'string', required: true },
          { name: 'end', displayName: 'End Time', type: 'string', required: true },
          { name: 'body', displayName: 'Body', type: 'string', required: false },
          { name: 'requiredAttendees', displayName: 'Required Attendees', type: 'string', required: false },
        ],
      },
    ],
  },
  {
    id: 'office365users',
    name: 'Office 365 Users',
    description: 'Access and manage Microsoft 365 user profiles and directories.',
    tier: 'Standard',
    category: 'Productivity',
    actions: [
      { id: 'MyProfile_V2', name: 'Get my profile (V2)', description: 'Returns the profile of the signed-in user.' },
      {
        id: 'UserProfile_V2',
        name: 'Get user profile (V2)',
        description: 'Returns the profile of a specific user.',
        parameters: [{ name: 'userId', displayName: 'User (UPN or ID)', type: 'string', required: true }],
      },
      {
        id: 'SearchUser',
        name: 'Search for users (V2)',
        description: 'Searches for users by display name or email.',
        parameters: [{ name: 'searchTerm', displayName: 'Search Term', type: 'string', required: true }],
      },
      { id: 'DirectReports_V2', name: 'Get direct reports (V2)', description: 'Returns a list of direct reports for a user.' },
      { id: 'GetManager_V2', name: "Get manager (V2)", description: "Returns the manager of a user." },
    ],
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Post messages, create chats, manage channels, and respond to Teams events.',
    tier: 'Standard',
    category: 'Collaboration',
    triggers: [
      { id: 'SubscribeUserEvents', name: 'When a new message is added to a channel', description: 'Triggers when a message is posted to a Teams channel.' },
      { id: 'SubscribeToMessages', name: 'When a new chat message is received', description: 'Triggers on a new chat message in a specific chat.' },
    ],
    actions: [
      {
        id: 'PostMessageToConversation',
        name: 'Post message in a chat or channel',
        description: 'Posts a message to a Teams channel or chat.',
        parameters: [
          { name: 'poster', displayName: 'Post as', type: 'string', required: true, description: 'User or Flow bot' },
          { name: 'location', displayName: 'Post in', type: 'string', required: true, description: 'Channel or Group chat or Chat with Flow bot' },
          { name: 'body/content', displayName: 'Message', type: 'string', required: true },
        ],
      },
      {
        id: 'PostAdaptiveCard',
        name: 'Post an Adaptive Card and wait for a response',
        description: 'Posts an Adaptive Card and waits for user input.',
        parameters: [
          { name: 'poster', displayName: 'Post as', type: 'string', required: true },
          { name: 'location', displayName: 'Post in', type: 'string', required: true },
          { name: 'body/messageBody', displayName: 'Adaptive Card JSON', type: 'string', required: true },
        ],
      },
      { id: 'CreateChannel', name: 'Create a channel', description: 'Creates a new channel in a Teams team.' },
      { id: 'ListChannels', name: 'List channels', description: 'Lists all channels in a team.' },
      { id: 'GetMessage', name: 'Get message details', description: 'Gets the details of a specific channel message.' },
      { id: 'CreateTeam', name: 'Create a team', description: 'Creates a new Microsoft Teams team.' },
      { id: 'AddMemberToTeam', name: 'Add a member to a team', description: 'Adds a user as a member to a Teams team.' },
    ],
  },
  {
    id: 'sharepointonline',
    name: 'SharePoint',
    description: 'Work with SharePoint lists, items, files, and document libraries.',
    tier: 'Standard',
    category: 'Files & Storage',
    triggers: [
      {
        id: 'GetOnNewItems',
        name: 'When an item is created',
        description: 'Triggers when a new item is created in a SharePoint list.',
        parameters: [
          { name: 'dataset', displayName: 'Site Address', type: 'string', required: true },
          { name: 'table', displayName: 'List Name', type: 'string', required: true },
        ],
      },
      {
        id: 'GetOnUpdatedItems',
        name: 'When an item is created or modified',
        description: 'Triggers when an item is created or modified in a SharePoint list.',
        parameters: [
          { name: 'dataset', displayName: 'Site Address', type: 'string', required: true },
          { name: 'table', displayName: 'List Name', type: 'string', required: true },
        ],
      },
      {
        id: 'OnFileCreated',
        name: 'When a file is created (properties only)',
        description: 'Triggers when a file is created in a document library.',
        parameters: [
          { name: 'dataset', displayName: 'Site Address', type: 'string', required: true },
          { name: 'folderId', displayName: 'Library Name', type: 'string', required: true },
        ],
      },
    ],
    actions: [
      {
        id: 'GetItems',
        name: 'Get items',
        description: 'Gets items from a SharePoint list with optional OData filtering.',
        parameters: [
          { name: 'dataset', displayName: 'Site Address', type: 'string', required: true },
          { name: 'table', displayName: 'List Name', type: 'string', required: true },
          { name: '$filter', displayName: 'Filter Query', type: 'string', required: false },
          { name: '$top', displayName: 'Top Count', type: 'integer', required: false },
          { name: '$orderby', displayName: 'Order By', type: 'string', required: false },
        ],
      },
      {
        id: 'GetItem',
        name: 'Get item',
        description: 'Gets a single item from a SharePoint list by ID.',
        parameters: [
          { name: 'dataset', displayName: 'Site Address', type: 'string', required: true },
          { name: 'table', displayName: 'List Name', type: 'string', required: true },
          { name: 'id', displayName: 'ID', type: 'integer', required: true },
        ],
      },
      { id: 'PostItem', name: 'Create item', description: 'Creates a new item in a SharePoint list.' },
      { id: 'PatchItem', name: 'Update item', description: 'Updates an existing item in a SharePoint list by ID.' },
      { id: 'DeleteItem', name: 'Delete item', description: 'Deletes an item from a SharePoint list by ID.' },
      { id: 'GetFileContent', name: 'Get file content', description: 'Gets the binary content of a file.' },
      { id: 'CreateFile', name: 'Create file', description: 'Uploads a file to a SharePoint document library.' },
      { id: 'UpdateFile', name: 'Update file properties', description: 'Updates the metadata properties of a file.' },
      { id: 'ListFolder', name: 'List folder', description: 'Lists files and folders in a SharePoint library folder.' },
      { id: 'SendEmail', name: 'Send an HTTP request to SharePoint', description: 'Sends a custom REST API request to SharePoint.' },
    ],
  },
  {
    id: 'onedriveforbusiness',
    name: 'OneDrive for Business',
    description: 'Create, read, update, and delete files in OneDrive for Business.',
    tier: 'Standard',
    category: 'Files & Storage',
    triggers: [
      { id: 'OnNewFileInFolder', name: 'When a file is created', description: 'Triggers when a new file is created in a OneDrive folder.' },
      { id: 'OnFileModified', name: 'When a file is modified', description: 'Triggers when a file is modified in a OneDrive folder.' },
    ],
    actions: [
      { id: 'GetFileContent', name: 'Get file content', description: 'Gets the binary content of a file by path.' },
      { id: 'CreateFile', name: 'Create file', description: 'Uploads a new file.' },
      { id: 'UpdateFile', name: 'Update file', description: 'Updates the content of an existing file.' },
      { id: 'DeleteFile', name: 'Delete file', description: 'Deletes a file.' },
      { id: 'ListFolder', name: 'List folder', description: 'Lists files and folders in a specific folder.' },
      { id: 'CopyFile', name: 'Copy file', description: 'Copies a file to a destination.' },
      { id: 'ConvertFile', name: 'Convert file', description: 'Converts a file to a different format (e.g., docx to PDF).' },
    ],
  },
  {
    id: 'excelonlinebusiness',
    name: 'Excel Online (Business)',
    description: 'Read and write Excel workbooks stored in SharePoint or OneDrive.',
    tier: 'Standard',
    category: 'Files & Storage',
    triggers: [
      { id: 'OnTableRowAdded', name: 'When a row is added (preview)', description: 'Triggers when a new row is added to an Excel table.' },
    ],
    actions: [
      {
        id: 'GetItems',
        name: 'List rows present in a table',
        description: 'Gets all rows from an Excel table.',
        parameters: [
          { name: 'source', displayName: 'Location', type: 'string', required: true },
          { name: 'drive', displayName: 'Document Library', type: 'string', required: true },
          { name: 'file', displayName: 'File', type: 'string', required: true },
          { name: 'table', displayName: 'Table', type: 'string', required: true },
          { name: '$filter', displayName: 'Filter Query', type: 'string', required: false },
        ],
      },
      { id: 'PostItem', name: 'Add a row into a table', description: 'Adds a new row to an Excel table.' },
      { id: 'PatchItem', name: 'Update a row', description: 'Updates an existing row in an Excel table.' },
      { id: 'DeleteItem', name: 'Delete a row', description: 'Deletes a row from an Excel table.' },
      { id: 'GetTables', name: 'List tables', description: 'Lists all tables in an Excel workbook.' },
      { id: 'RunScript', name: 'Run script', description: 'Runs an Office Script in an Excel workbook.' },
    ],
  },
  {
    id: 'planner',
    name: 'Planner',
    description: 'Create and manage tasks, buckets, and plans in Microsoft Planner.',
    tier: 'Standard',
    category: 'Productivity',
    triggers: [
      { id: 'SubscribeTaskAssignedToMe', name: 'When a task is assigned to me', description: 'Triggers when a task is assigned to the current user.' },
      { id: 'SubscribeNewTask', name: 'When a new task is created', description: 'Triggers when a new task is created in a plan.' },
    ],
    actions: [
      { id: 'CreateTask', name: 'Create a task', description: 'Creates a new task in a Planner plan.' },
      { id: 'UpdateTask', name: 'Update task details', description: 'Updates an existing Planner task.' },
      { id: 'GetTask', name: 'Get task details', description: 'Gets the details of a specific Planner task.' },
      { id: 'ListTasks', name: 'List tasks', description: 'Lists all tasks in a Planner plan or bucket.' },
      { id: 'DeleteTask', name: 'Delete a task', description: 'Deletes a Planner task.' },
      { id: 'CreateBucket', name: 'Create a bucket', description: 'Creates a new bucket in a Planner plan.' },
    ],
  },
  {
    id: 'approvals',
    name: 'Approvals',
    description: 'Request and manage approvals within Power Automate flows.',
    tier: 'Standard',
    category: 'Productivity',
    triggers: [
      { id: 'WhenApprovalCompleted', name: 'When an approval is completed', description: 'Triggers when an approval request created by this flow is completed.' },
    ],
    actions: [
      {
        id: 'CreateApproval',
        name: 'Start and wait for an approval',
        description: 'Sends an approval request and pauses the flow until a response is received.',
        parameters: [
          { name: 'approvalType', displayName: 'Approval type', type: 'string', required: true, description: 'Approve/Reject - First to respond, Everyone must approve, etc.' },
          { name: 'Title', displayName: 'Title', type: 'string', required: true },
          { name: 'AssignedTo', displayName: 'Assigned to', type: 'string', required: true },
          { name: 'Details', displayName: 'Details', type: 'string', required: false },
          { name: 'ItemLink', displayName: 'Item link', type: 'string', required: false },
        ],
      },
      { id: 'CreateApprovalV2', name: 'Create an approval', description: 'Creates an approval request without waiting (use with Wait for an approval action).' },
      { id: 'WaitForApproval', name: 'Wait for an approval', description: 'Pauses the flow until a specific approval is completed.' },
      { id: 'RespondToApproval', name: 'Respond to an approval', description: 'Responds to an approval on behalf of the flow.' },
    ],
  },
  {
    id: 'microsoftforms',
    name: 'Microsoft Forms',
    description: 'Respond to new form submissions in Microsoft Forms.',
    tier: 'Standard',
    category: 'Productivity',
    triggers: [
      {
        id: 'SubscribeWebhook',
        name: 'When a new response is submitted',
        description: 'Triggers when someone submits a response to a Microsoft Form.',
        parameters: [{ name: 'form_id', displayName: 'Form Id', type: 'string', required: true }],
      },
    ],
    actions: [
      {
        id: 'GetResponseDetails',
        name: 'Get response details',
        description: 'Gets the detailed response data for a specific form submission.',
        parameters: [
          { name: 'form_id', displayName: 'Form Id', type: 'string', required: true },
          { name: 'response_id', displayName: 'Response Id', type: 'string', required: true },
        ],
      },
      { id: 'ListResponses', name: 'List responses', description: 'Lists all responses submitted to a form.' },
    ],
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Send push notifications to mobile devices via the Power Automate mobile app.',
    tier: 'Standard',
    category: 'Productivity',
    actions: [
      {
        id: 'SendNotification',
        name: 'Send me a mobile notification',
        description: 'Sends a push notification to the signed-in user\'s mobile device.',
        parameters: [
          { name: 'notificationText', displayName: 'Text', type: 'string', required: true },
          { name: 'notificationLink', displayName: 'Link', type: 'string', required: false },
          { name: 'notificationLinkLabel', displayName: 'Link label', type: 'string', required: false },
        ],
      },
    ],
  },

  // ── Azure ─────────────────────────────────────────────────────────────────
  {
    id: 'azureblob',
    name: 'Azure Blob Storage',
    description: 'Read, write, and manage files in Azure Blob Storage containers.',
    tier: 'Standard',
    category: 'Azure',
    triggers: [
      { id: 'OnBlobCreated', name: 'When a blob is added or modified (V2)', description: 'Triggers when a blob is added or modified in a container.' },
    ],
    actions: [
      { id: 'GetBlob', name: 'Get blob content', description: 'Gets the binary content of a blob.' },
      { id: 'CreateBlob', name: 'Create blob (V2)', description: 'Uploads a new blob to a container.' },
      { id: 'UpdateBlob', name: 'Update blob (V2)', description: 'Updates the content of an existing blob.' },
      { id: 'DeleteBlob', name: 'Delete blob', description: 'Deletes a blob from a container.' },
      { id: 'ListBlobs', name: 'List blobs (V2)', description: 'Lists blobs in a container or folder.' },
      { id: 'CopyBlob', name: 'Copy blob', description: 'Copies a blob to a new destination.' },
    ],
  },
  {
    id: 'azurequeues',
    name: 'Azure Queues',
    description: 'Put and get messages from Azure Storage Queues.',
    tier: 'Standard',
    category: 'Azure',
    triggers: [
      { id: 'OnMessageAvailable', name: 'When there are messages in a queue', description: 'Triggers when a message arrives in an Azure Queue.' },
    ],
    actions: [
      { id: 'PutMessage', name: 'Put a message on a queue', description: 'Adds a message to an Azure Storage Queue.' },
      { id: 'GetMessages', name: 'Get messages', description: 'Gets one or more messages from an Azure Queue.' },
      { id: 'DeleteMessage', name: 'Delete message', description: 'Deletes a message from an Azure Queue.' },
    ],
  },
  {
    id: 'servicebus',
    name: 'Service Bus',
    description: 'Send and receive messages from Azure Service Bus queues and topics.',
    tier: 'Premium',
    category: 'Azure',
    triggers: [
      { id: 'SubscribeToMessages', name: 'When a message is received in a queue (auto-complete)', description: 'Triggers on a new message in a Service Bus queue.' },
      { id: 'WhenTopicSubscriptionHasMessage', name: 'When a message is received in a topic subscription', description: 'Triggers on a new message in a Service Bus topic subscription.' },
    ],
    actions: [
      { id: 'SendMessage', name: 'Send message', description: 'Sends a message to a Service Bus queue or topic.' },
      { id: 'GetMessages', name: 'Get messages from a queue (peek-lock)', description: 'Gets messages from a queue with peek-lock (manual completion).' },
      { id: 'CompleteMessage', name: 'Complete the message in a queue', description: 'Marks a message as successfully processed.' },
      { id: 'AbandonMessage', name: 'Abandon the message in a queue', description: 'Returns a message to the queue for reprocessing.' },
    ],
  },
  {
    id: 'azureeventgrid',
    name: 'Azure Event Grid',
    description: 'Publish and subscribe to events via Azure Event Grid.',
    tier: 'Standard',
    category: 'Azure',
    triggers: [
      { id: 'SubscribeToEventGrid', name: 'When a resource event occurs', description: 'Triggers when a resource event is published to Event Grid.' },
    ],
    actions: [
      { id: 'PublishEvent', name: 'Publish event', description: 'Publishes one or more events to an Event Grid topic.' },
    ],
  },
  {
    id: 'azurekv',
    name: 'Azure Key Vault',
    description: 'Retrieve secrets from Azure Key Vault at runtime.',
    tier: 'Premium',
    category: 'Azure',
    actions: [
      { id: 'GetSecret', name: 'Get secret', description: 'Retrieves a secret value from Azure Key Vault.' },
      { id: 'ListSecrets', name: 'List secrets', description: 'Lists the names of secrets in the vault.' },
      { id: 'SetSecret', name: 'Set secret', description: 'Creates or updates a secret in Azure Key Vault.' },
    ],
  },
  {
    id: 'azuredevops',
    name: 'Azure DevOps',
    description: 'Manage work items, pipelines, and repositories in Azure DevOps.',
    tier: 'Standard',
    category: 'Developer Tools',
    triggers: [
      { id: 'SubscribeWorkItem', name: 'When a work item is created', description: 'Triggers when a new work item is created.' },
      { id: 'SubscribeWorkItemUpdated', name: 'When a work item is updated', description: 'Triggers when a work item field is changed.' },
      { id: 'SubscribeBuildComplete', name: 'When a build completes', description: 'Triggers when a pipeline build finishes.' },
    ],
    actions: [
      { id: 'CreateWorkItem', name: 'Create a work item', description: 'Creates a new work item (Bug, Task, User Story, etc.).' },
      { id: 'UpdateWorkItem', name: 'Update a work item', description: 'Updates fields on an existing work item.' },
      { id: 'GetWorkItem', name: 'Get a work item', description: 'Gets the details of a work item by ID.' },
      { id: 'AddComment', name: 'Add comment to work item', description: 'Adds a comment to a work item discussion.' },
      { id: 'QueueBuild', name: 'Queue a new build', description: 'Queues a new pipeline run.' },
    ],
  },

  // ── CRM / ERP ─────────────────────────────────────────────────────────────
  {
    id: 'commondataservice',
    name: 'Microsoft Dataverse',
    description: 'Create, read, update, and delete rows in Dataverse tables. Trigger on record events.',
    tier: 'Premium',
    category: 'Data',
    triggers: [
      {
        id: 'SubscribeWebhookTrigger',
        name: 'When a row is added, modified or deleted',
        description: 'Triggers when a Dataverse record is created, updated, or deleted.',
        parameters: [
          { name: 'entityname', displayName: 'Table Name', type: 'string', required: true },
          { name: 'scope', displayName: 'Scope', type: 'string', required: true, description: 'Organization, Business unit, Parent and child business units, User' },
          { name: 'filterexpression', displayName: 'Filter Rows', type: 'string', required: false },
          { name: 'filteringattributes', displayName: 'Filter Columns', type: 'string', required: false },
        ],
      },
    ],
    actions: [
      {
        id: 'ListRecords',
        name: 'List rows',
        description: 'Gets a list of rows from a Dataverse table.',
        parameters: [
          { name: 'entityName', displayName: 'Table Name', type: 'string', required: true },
          { name: '$filter', displayName: 'Filter Rows', type: 'string', required: false },
          { name: '$select', displayName: 'Select Columns', type: 'string', required: false },
          { name: '$top', displayName: 'Row Count', type: 'integer', required: false },
        ],
      },
      { id: 'GetRecord', name: 'Get a row by ID', description: 'Gets a single Dataverse row by its primary key.' },
      { id: 'CreateRecord', name: 'Add a new row', description: 'Creates a new row in a Dataverse table.' },
      { id: 'UpdateRecord', name: 'Update a row', description: 'Updates an existing Dataverse row by ID.' },
      { id: 'DeleteRecord', name: 'Delete a row', description: 'Deletes a Dataverse row by ID.' },
      { id: 'PerformBoundAction', name: 'Perform a bound action', description: 'Calls a Dataverse bound action on a specific record.' },
      { id: 'PerformUnboundAction', name: 'Perform an unbound action', description: 'Calls a Dataverse unbound action (global action).' },
    ],
  },
  {
    id: 'sql',
    name: 'SQL Server',
    description: 'Connect to SQL Server or Azure SQL and run queries, stored procedures, and CRUD operations.',
    tier: 'Premium',
    category: 'Data',
    triggers: [
      { id: 'SubscribeWebhookTrigger', name: 'When an item is created (V2)', description: 'Triggers when a new row is added to a SQL table.' },
      { id: 'SubscribeWebhookTriggerModified', name: 'When an item is modified (V2)', description: 'Triggers when a row is updated in a SQL table.' },
    ],
    actions: [
      { id: 'GetItems', name: 'Get rows (V2)', description: 'Gets rows from a SQL table.' },
      { id: 'GetItem', name: 'Get row (V2)', description: 'Gets a single row from a SQL table by primary key.' },
      { id: 'PostItem', name: 'Insert row (V2)', description: 'Inserts a new row into a SQL table.' },
      { id: 'PatchItem', name: 'Update row (V2)', description: 'Updates an existing row in a SQL table.' },
      { id: 'DeleteItem', name: 'Delete row (V2)', description: 'Deletes a row from a SQL table by primary key.' },
      {
        id: 'ExecutePassThroughNativeQuery',
        name: 'Execute SQL query (V2)',
        description: 'Executes a raw SQL query and returns the results.',
        parameters: [{ name: 'query', displayName: 'Query', type: 'string', required: true }],
      },
      { id: 'ExecuteProcedure', name: 'Execute stored procedure (V2)', description: 'Runs a stored procedure and returns any result sets or output params.' },
    ],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Create, read, update, and delete Salesforce objects. Trigger on record events.',
    tier: 'Premium',
    category: 'CRM',
    triggers: [
      { id: 'SubscribeWebhook', name: 'When a record is created', description: 'Triggers when a new Salesforce record is created.' },
      { id: 'SubscribeWebhookModified', name: 'When a record is modified', description: 'Triggers when a Salesforce record is changed.' },
    ],
    actions: [
      { id: 'GetItems', name: 'Get records', description: 'Gets Salesforce records of a specified type.' },
      { id: 'GetItem', name: 'Get record', description: 'Gets a single Salesforce record by ID.' },
      { id: 'PostItem', name: 'Create record', description: 'Creates a new Salesforce record.' },
      { id: 'PatchItem', name: 'Update record', description: 'Updates a Salesforce record by ID.' },
      { id: 'DeleteItem', name: 'Delete record', description: 'Deletes a Salesforce record.' },
    ],
  },
  {
    id: 'servicenow',
    name: 'ServiceNow',
    description: 'Create and update ServiceNow incidents, problems, changes, and other records.',
    tier: 'Premium',
    category: 'IT Service Management',
    triggers: [
      { id: 'SubscribeWebhook', name: 'When a record is created', description: 'Triggers when a ServiceNow record is created.' },
    ],
    actions: [
      { id: 'GetRecords', name: 'List records', description: 'Gets ServiceNow records from a table.' },
      { id: 'GetRecord', name: 'Get record', description: 'Gets a specific ServiceNow record by sys_id.' },
      { id: 'CreateRecord', name: 'Create record', description: 'Creates a new ServiceNow record.' },
      { id: 'UpdateRecord', name: 'Update record', description: 'Updates an existing ServiceNow record.' },
    ],
  },

  // ── AI ────────────────────────────────────────────────────────────────────
  {
    id: 'aibuilder',
    name: 'AI Builder',
    description: 'Use pre-built and custom AI models to classify text, extract info from documents, predict outcomes, and more.',
    tier: 'Premium',
    category: 'AI',
    actions: [
      { id: 'PredictTextClassification', name: 'Classify text into categories (preview)', description: 'Uses a custom AI model to classify a text input into categories.' },
      { id: 'RecognizeText', name: 'Extract information from documents', description: 'Extracts structured data from invoices, receipts, business cards, or custom document models.' },
      { id: 'PredictAnomalyDetection', name: 'Detect anomalies in time series data', description: 'Identifies anomalies in a series of time-based data points.' },
      { id: 'AnalyzeSentiment', name: 'Analyze positive or negative sentiment in text', description: 'Returns a sentiment score and label for a text string.' },
      { id: 'ExtractKeyPhrases', name: 'Extract key phrases from text', description: 'Returns key noun phrases from a text input.' },
      { id: 'RecognizeEntities', name: 'Recognize entities in text', description: 'Identifies named entities (people, places, organizations, dates, etc.) in text.' },
      { id: 'PredictBinaryClassification', name: 'Predict Yes or No', description: 'Uses a custom binary classification model to predict a yes/no outcome.' },
    ],
  },

  // ── Communication ─────────────────────────────────────────────────────────
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Send emails using the SendGrid email delivery platform.',
    tier: 'Standard',
    category: 'Email & Calendar',
    actions: [
      {
        id: 'SendEmailV3',
        name: 'Send email (V3)',
        description: 'Sends an email via the SendGrid API.',
        parameters: [
          { name: 'from', displayName: 'From', type: 'string', required: true },
          { name: 'to', displayName: 'To', type: 'string', required: true },
          { name: 'subject', displayName: 'Subject', type: 'string', required: true },
          { name: 'text', displayName: 'Email Body', type: 'string', required: true },
          { name: 'ishtml', displayName: 'Is HTML', type: 'boolean', required: false },
        ],
      },
    ],
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Send and receive SMS, WhatsApp, and voice messages via Twilio.',
    tier: 'Premium',
    category: 'Communication',
    triggers: [
      { id: 'OnIncomingSMS', name: 'When a text message is received', description: 'Triggers when an SMS is received on a Twilio phone number.' },
    ],
    actions: [
      {
        id: 'SendSMS',
        name: 'Send Text Message (SMS)',
        description: 'Sends an SMS message via Twilio.',
        parameters: [
          { name: 'from', displayName: 'From Phone Number', type: 'string', required: true },
          { name: 'to', displayName: 'To Phone Number', type: 'string', required: true },
          { name: 'body', displayName: 'Text', type: 'string', required: true },
        ],
      },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Post messages and react to events in Slack workspaces and channels.',
    tier: 'Standard',
    category: 'Collaboration',
    triggers: [
      { id: 'OnNewMention', name: 'When I am mentioned in a message', description: 'Triggers when the configured user is @mentioned in Slack.' },
    ],
    actions: [
      {
        id: 'PostMessage',
        name: 'Post message',
        description: 'Posts a message to a Slack channel.',
        parameters: [
          { name: 'channelId', displayName: 'Channel name', type: 'string', required: true },
          { name: 'text', displayName: 'Message Text', type: 'string', required: true },
          { name: 'username', displayName: 'Bot name', type: 'string', required: false },
        ],
      },
    ],
  },

  // ── Developer / Integration ────────────────────────────────────────────────
  {
    id: 'github',
    name: 'GitHub',
    description: 'Manage GitHub issues, pull requests, and repositories.',
    tier: 'Standard',
    category: 'Developer Tools',
    triggers: [
      { id: 'issue_opened', name: 'When a new issue is opened', description: 'Triggers when a new issue is created in a repository.' },
      { id: 'push', name: 'When a commit is pushed', description: 'Triggers when code is pushed to a repository.' },
    ],
    actions: [
      { id: 'CreateIssue', name: 'Create an issue', description: 'Creates a new GitHub issue.' },
      { id: 'UpdateIssue', name: 'Update an issue', description: 'Updates an existing GitHub issue.' },
      { id: 'CreateComment', name: 'Create a comment on an issue', description: 'Adds a comment to a GitHub issue.' },
      { id: 'ListIssues', name: 'List issues', description: 'Lists issues in a GitHub repository.' },
    ],
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Create and update Jira issues, and respond to Jira project events.',
    tier: 'Standard',
    category: 'Developer Tools',
    triggers: [
      { id: 'SubscribeWebhook', name: 'When a new issue is created', description: 'Triggers when a new Jira issue is created.' },
    ],
    actions: [
      { id: 'CreateIssue', name: 'Create issue', description: 'Creates a new Jira issue.' },
      { id: 'UpdateIssue', name: 'Update issue', description: 'Updates an existing Jira issue.' },
      { id: 'GetIssue', name: 'Get issue', description: 'Gets details of a specific Jira issue.' },
      { id: 'AddComment', name: 'Add comment', description: 'Adds a comment to a Jira issue.' },
    ],
  },
  {
    id: 'googledrive',
    name: 'Google Drive',
    description: 'Create, read, and manage files in Google Drive.',
    tier: 'Standard',
    category: 'Files & Storage',
    triggers: [
      { id: 'OnNewFile', name: 'When a file is created', description: 'Triggers when a new file is added to Google Drive.' },
    ],
    actions: [
      { id: 'GetFileContent', name: 'Get file content', description: 'Gets the binary content of a Google Drive file.' },
      { id: 'CreateFile', name: 'Create file', description: 'Uploads a new file to Google Drive.' },
      { id: 'ListFiles', name: 'List files in folder', description: 'Lists files in a Google Drive folder.' },
      { id: 'DeleteFile', name: 'Delete file', description: 'Deletes a file from Google Drive.' },
    ],
  },
];

/** Returns connectors whose name, id, description, or category match the query string (case-insensitive). */
export function searchConnectors(query?: string, tier?: ConnectorTier): Connector[] {
  const q = query?.toLowerCase() ?? '';
  return CONNECTORS.filter((c) => {
    const tierMatch = !tier || c.tier === tier;
    if (!q) {return tierMatch;}
    const textMatch =
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.actions.some(
        (a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      ) ||
      (c.triggers ?? []).some(
        (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    return tierMatch && textMatch;
  });
}
