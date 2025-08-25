import {
  AIMessage,
  AIMessageChunk,
  BaseMessage,
  BaseMessageChunk,
  BasePromptTemplate,
  BaseStringPromptTemplate,
  ChatMessage,
  ChatMessageChunk,
  ChatPromptValue,
  FunctionMessage,
  FunctionMessageChunk,
  HumanMessage,
  HumanMessageChunk,
  ImagePromptValue,
  PromptTemplate,
  Runnable,
  RunnableLambda,
  SystemMessage,
  SystemMessageChunk,
  ToolMessage,
  ToolMessageChunk,
  _isMessageFieldWithRole,
  _mergeDicts,
  _mergeLists,
  _mergeObj,
  _mergeStatus,
  addLangChainErrorFields,
  checkValidTemplate,
  coerceMessageLikeToMessage,
  convertToChunk,
  convertToOpenAIImageBlock,
  convertToProviderContentBlock,
  getBufferString,
  isAIMessage,
  isAIMessageChunk,
  isBase64ContentBlock,
  isBaseMessage,
  isBaseMessageChunk,
  isChatMessage,
  isChatMessageChunk,
  isDataContentBlock,
  isFunctionMessage,
  isFunctionMessageChunk,
  isHumanMessage,
  isHumanMessageChunk,
  isIDContentBlock,
  isOpenAIToolCallArray,
  isPlainTextContentBlock,
  isSystemMessage,
  isSystemMessageChunk,
  isToolMessage,
  isToolMessageChunk,
  isURLContentBlock,
  mapChatMessagesToStoredMessages,
  mapStoredMessageToChatMessage,
  mapStoredMessagesToChatMessages,
  mergeContent,
  parseBase64DataUrl,
  parseFString,
  parseMimeType,
  parseMustache,
  parseTemplate,
  renderTemplate
} from "./chunk-GBLXN26G.mjs";
import {
  __export,
  init_esm
} from "./chunk-UGJZ2EIQ.mjs";

// ../../../node_modules/.pnpm/@langchain+core@0.3.61_@opentelemetry+api@1.9.0_@opentelemetry+exporter-trace-otlp-prot_0b0ad8d1f102d40fa2004ef9b372cb09/node_modules/@langchain/core/dist/prompts/few_shot.js
init_esm();

// ../../../node_modules/.pnpm/@langchain+core@0.3.61_@opentelemetry+api@1.9.0_@opentelemetry+exporter-trace-otlp-prot_0b0ad8d1f102d40fa2004ef9b372cb09/node_modules/@langchain/core/dist/prompts/chat.js
init_esm();

// ../../../node_modules/.pnpm/@langchain+core@0.3.61_@opentelemetry+api@1.9.0_@opentelemetry+exporter-trace-otlp-prot_0b0ad8d1f102d40fa2004ef9b372cb09/node_modules/@langchain/core/dist/messages/index.js
var messages_exports = {};
__export(messages_exports, {
  AIMessage: () => AIMessage,
  AIMessageChunk: () => AIMessageChunk,
  BaseMessage: () => BaseMessage,
  BaseMessageChunk: () => BaseMessageChunk,
  ChatMessage: () => ChatMessage,
  ChatMessageChunk: () => ChatMessageChunk,
  FunctionMessage: () => FunctionMessage,
  FunctionMessageChunk: () => FunctionMessageChunk,
  HumanMessage: () => HumanMessage,
  HumanMessageChunk: () => HumanMessageChunk,
  RemoveMessage: () => RemoveMessage,
  SystemMessage: () => SystemMessage,
  SystemMessageChunk: () => SystemMessageChunk,
  ToolMessage: () => ToolMessage,
  ToolMessageChunk: () => ToolMessageChunk,
  _isMessageFieldWithRole: () => _isMessageFieldWithRole,
  _mergeDicts: () => _mergeDicts,
  _mergeLists: () => _mergeLists,
  _mergeObj: () => _mergeObj,
  _mergeStatus: () => _mergeStatus,
  coerceMessageLikeToMessage: () => coerceMessageLikeToMessage,
  convertToChunk: () => convertToChunk,
  convertToOpenAIImageBlock: () => convertToOpenAIImageBlock,
  convertToProviderContentBlock: () => convertToProviderContentBlock,
  defaultTextSplitter: () => defaultTextSplitter,
  filterMessages: () => filterMessages,
  getBufferString: () => getBufferString,
  isAIMessage: () => isAIMessage,
  isAIMessageChunk: () => isAIMessageChunk,
  isBase64ContentBlock: () => isBase64ContentBlock,
  isBaseMessage: () => isBaseMessage,
  isBaseMessageChunk: () => isBaseMessageChunk,
  isChatMessage: () => isChatMessage,
  isChatMessageChunk: () => isChatMessageChunk,
  isDataContentBlock: () => isDataContentBlock,
  isFunctionMessage: () => isFunctionMessage,
  isFunctionMessageChunk: () => isFunctionMessageChunk,
  isHumanMessage: () => isHumanMessage,
  isHumanMessageChunk: () => isHumanMessageChunk,
  isIDContentBlock: () => isIDContentBlock,
  isOpenAIToolCallArray: () => isOpenAIToolCallArray,
  isPlainTextContentBlock: () => isPlainTextContentBlock,
  isSystemMessage: () => isSystemMessage,
  isSystemMessageChunk: () => isSystemMessageChunk,
  isToolMessage: () => isToolMessage,
  isToolMessageChunk: () => isToolMessageChunk,
  isURLContentBlock: () => isURLContentBlock,
  mapChatMessagesToStoredMessages: () => mapChatMessagesToStoredMessages,
  mapStoredMessageToChatMessage: () => mapStoredMessageToChatMessage,
  mapStoredMessagesToChatMessages: () => mapStoredMessagesToChatMessages,
  mergeContent: () => mergeContent,
  mergeMessageRuns: () => mergeMessageRuns,
  parseBase64DataUrl: () => parseBase64DataUrl,
  parseMimeType: () => parseMimeType,
  trimMessages: () => trimMessages
});
init_esm();

// ../../../node_modules/.pnpm/@langchain+core@0.3.61_@opentelemetry+api@1.9.0_@opentelemetry+exporter-trace-otlp-prot_0b0ad8d1f102d40fa2004ef9b372cb09/node_modules/@langchain/core/dist/messages/transformers.js
init_esm();

// ../../../node_modules/.pnpm/@langchain+core@0.3.61_@opentelemetry+api@1.9.0_@opentelemetry+exporter-trace-otlp-prot_0b0ad8d1f102d40fa2004ef9b372cb09/node_modules/@langchain/core/dist/messages/modifier.js
init_esm();
var RemoveMessage = class extends BaseMessage {
  constructor(fields) {
    super({
      ...fields,
      content: ""
    });
    Object.defineProperty(this, "id", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.id = fields.id;
  }
  _getType() {
    return "remove";
  }
  get _printableFields() {
    return {
      ...super._printableFields,
      id: this.id
    };
  }
};

// ../../../node_modules/.pnpm/@langchain+core@0.3.61_@opentelemetry+api@1.9.0_@opentelemetry+exporter-trace-otlp-prot_0b0ad8d1f102d40fa2004ef9b372cb09/node_modules/@langchain/core/dist/messages/transformers.js
var _isMessageType = (msg, types) => {
  const typesAsStrings = [
    ...new Set(types?.map((t) => {
      if (typeof t === "string") {
        return t;
      }
      const instantiatedMsgClass = new t({});
      if (!("getType" in instantiatedMsgClass) || typeof instantiatedMsgClass.getType !== "function") {
        throw new Error("Invalid type provided.");
      }
      return instantiatedMsgClass.getType();
    }))
  ];
  const msgType = msg.getType();
  return typesAsStrings.some((t) => t === msgType);
};
function filterMessages(messagesOrOptions, options) {
  if (Array.isArray(messagesOrOptions)) {
    return _filterMessages(messagesOrOptions, options);
  }
  return RunnableLambda.from((input) => {
    return _filterMessages(input, messagesOrOptions);
  });
}
function _filterMessages(messages, options = {}) {
  const { includeNames, excludeNames, includeTypes, excludeTypes, includeIds, excludeIds } = options;
  const filtered = [];
  for (const msg of messages) {
    if (excludeNames && msg.name && excludeNames.includes(msg.name)) {
      continue;
    } else if (excludeTypes && _isMessageType(msg, excludeTypes)) {
      continue;
    } else if (excludeIds && msg.id && excludeIds.includes(msg.id)) {
      continue;
    }
    if (!(includeTypes || includeIds || includeNames)) {
      filtered.push(msg);
    } else if (includeNames && msg.name && includeNames.some((iName) => iName === msg.name)) {
      filtered.push(msg);
    } else if (includeTypes && _isMessageType(msg, includeTypes)) {
      filtered.push(msg);
    } else if (includeIds && msg.id && includeIds.some((id) => id === msg.id)) {
      filtered.push(msg);
    }
  }
  return filtered;
}
function mergeMessageRuns(messages) {
  if (Array.isArray(messages)) {
    return _mergeMessageRuns(messages);
  }
  return RunnableLambda.from(_mergeMessageRuns);
}
function _mergeMessageRuns(messages) {
  if (!messages.length) {
    return [];
  }
  const merged = [];
  for (const msg of messages) {
    const curr = msg;
    const last = merged.pop();
    if (!last) {
      merged.push(curr);
    } else if (curr.getType() === "tool" || !(curr.getType() === last.getType())) {
      merged.push(last, curr);
    } else {
      const lastChunk = convertToChunk(last);
      const currChunk = convertToChunk(curr);
      const mergedChunks = lastChunk.concat(currChunk);
      if (typeof lastChunk.content === "string" && typeof currChunk.content === "string") {
        mergedChunks.content = `${lastChunk.content}
${currChunk.content}`;
      }
      merged.push(_chunkToMsg(mergedChunks));
    }
  }
  return merged;
}
function trimMessages(messagesOrOptions, options) {
  if (Array.isArray(messagesOrOptions)) {
    const messages = messagesOrOptions;
    if (!options) {
      throw new Error("Options parameter is required when providing messages.");
    }
    return _trimMessagesHelper(messages, options);
  } else {
    const trimmerOptions = messagesOrOptions;
    return RunnableLambda.from((input) => _trimMessagesHelper(input, trimmerOptions)).withConfig({
      runName: "trim_messages"
    });
  }
}
async function _trimMessagesHelper(messages, options) {
  const { maxTokens, tokenCounter, strategy = "last", allowPartial = false, endOn, startOn, includeSystem = false, textSplitter } = options;
  if (startOn && strategy === "first") {
    throw new Error("`startOn` should only be specified if `strategy` is 'last'.");
  }
  if (includeSystem && strategy === "first") {
    throw new Error("`includeSystem` should only be specified if `strategy` is 'last'.");
  }
  let listTokenCounter;
  if ("getNumTokens" in tokenCounter) {
    listTokenCounter = async (msgs) => {
      const tokenCounts = await Promise.all(msgs.map((msg) => tokenCounter.getNumTokens(msg.content)));
      return tokenCounts.reduce((sum, count) => sum + count, 0);
    };
  } else {
    listTokenCounter = async (msgs) => tokenCounter(msgs);
  }
  let textSplitterFunc = defaultTextSplitter;
  if (textSplitter) {
    if ("splitText" in textSplitter) {
      textSplitterFunc = textSplitter.splitText;
    } else {
      textSplitterFunc = async (text) => textSplitter(text);
    }
  }
  if (strategy === "first") {
    return _firstMaxTokens(messages, {
      maxTokens,
      tokenCounter: listTokenCounter,
      textSplitter: textSplitterFunc,
      partialStrategy: allowPartial ? "first" : void 0,
      endOn
    });
  } else if (strategy === "last") {
    return _lastMaxTokens(messages, {
      maxTokens,
      tokenCounter: listTokenCounter,
      textSplitter: textSplitterFunc,
      allowPartial,
      includeSystem,
      startOn,
      endOn
    });
  } else {
    throw new Error(`Unrecognized strategy: '${strategy}'. Must be one of 'first' or 'last'.`);
  }
}
async function _firstMaxTokens(messages, options) {
  const { maxTokens, tokenCounter, textSplitter, partialStrategy, endOn } = options;
  let messagesCopy = [...messages];
  let idx = 0;
  for (let i = 0; i < messagesCopy.length; i += 1) {
    const remainingMessages = i > 0 ? messagesCopy.slice(0, -i) : messagesCopy;
    if (await tokenCounter(remainingMessages) <= maxTokens) {
      idx = messagesCopy.length - i;
      break;
    }
  }
  if (idx < messagesCopy.length - 1 && partialStrategy) {
    let includedPartial = false;
    if (Array.isArray(messagesCopy[idx].content)) {
      const excluded = messagesCopy[idx];
      if (typeof excluded.content === "string") {
        throw new Error("Expected content to be an array.");
      }
      const numBlock = excluded.content.length;
      const reversedContent = partialStrategy === "last" ? [...excluded.content].reverse() : excluded.content;
      for (let i = 1; i <= numBlock; i += 1) {
        const partialContent = partialStrategy === "first" ? reversedContent.slice(0, i) : reversedContent.slice(-i);
        const fields = Object.fromEntries(Object.entries(excluded).filter(([k]) => k !== "type" && !k.startsWith("lc_")));
        const updatedMessage = _switchTypeToMessage(excluded.getType(), {
          ...fields,
          content: partialContent
        });
        const slicedMessages = [...messagesCopy.slice(0, idx), updatedMessage];
        if (await tokenCounter(slicedMessages) <= maxTokens) {
          messagesCopy = slicedMessages;
          idx += 1;
          includedPartial = true;
        } else {
          break;
        }
      }
      if (includedPartial && partialStrategy === "last") {
        excluded.content = [...reversedContent].reverse();
      }
    }
    if (!includedPartial) {
      const excluded = messagesCopy[idx];
      let text;
      if (Array.isArray(excluded.content) && excluded.content.some((block) => typeof block === "string" || block.type === "text")) {
        const textBlock = excluded.content.find((block) => block.type === "text" && block.text);
        text = textBlock?.text;
      } else if (typeof excluded.content === "string") {
        text = excluded.content;
      }
      if (text) {
        const splitTexts = await textSplitter(text);
        const numSplits = splitTexts.length;
        if (partialStrategy === "last") {
          splitTexts.reverse();
        }
        for (let _ = 0; _ < numSplits - 1; _ += 1) {
          splitTexts.pop();
          excluded.content = splitTexts.join("");
          if (await tokenCounter([...messagesCopy.slice(0, idx), excluded]) <= maxTokens) {
            if (partialStrategy === "last") {
              excluded.content = [...splitTexts].reverse().join("");
            }
            messagesCopy = [...messagesCopy.slice(0, idx), excluded];
            idx += 1;
            break;
          }
        }
      }
    }
  }
  if (endOn) {
    const endOnArr = Array.isArray(endOn) ? endOn : [endOn];
    while (idx > 0 && !_isMessageType(messagesCopy[idx - 1], endOnArr)) {
      idx -= 1;
    }
  }
  return messagesCopy.slice(0, idx);
}
async function _lastMaxTokens(messages, options) {
  const { allowPartial = false, includeSystem = false, endOn, startOn, ...rest } = options;
  let messagesCopy = messages.map((message) => {
    const fields = Object.fromEntries(Object.entries(message).filter(([k]) => k !== "type" && !k.startsWith("lc_")));
    return _switchTypeToMessage(message.getType(), fields, isBaseMessageChunk(message));
  });
  if (endOn) {
    const endOnArr = Array.isArray(endOn) ? endOn : [endOn];
    while (messagesCopy.length > 0 && !_isMessageType(messagesCopy[messagesCopy.length - 1], endOnArr)) {
      messagesCopy = messagesCopy.slice(0, -1);
    }
  }
  const swappedSystem = includeSystem && messagesCopy[0]?.getType() === "system";
  let reversed_ = swappedSystem ? messagesCopy.slice(0, 1).concat(messagesCopy.slice(1).reverse()) : messagesCopy.reverse();
  reversed_ = await _firstMaxTokens(reversed_, {
    ...rest,
    partialStrategy: allowPartial ? "last" : void 0,
    endOn: startOn
  });
  if (swappedSystem) {
    return [reversed_[0], ...reversed_.slice(1).reverse()];
  } else {
    return reversed_.reverse();
  }
}
var _MSG_CHUNK_MAP = {
  human: {
    message: HumanMessage,
    messageChunk: HumanMessageChunk
  },
  ai: {
    message: AIMessage,
    messageChunk: AIMessageChunk
  },
  system: {
    message: SystemMessage,
    messageChunk: SystemMessageChunk
  },
  developer: {
    message: SystemMessage,
    messageChunk: SystemMessageChunk
  },
  tool: {
    message: ToolMessage,
    messageChunk: ToolMessageChunk
  },
  function: {
    message: FunctionMessage,
    messageChunk: FunctionMessageChunk
  },
  generic: {
    message: ChatMessage,
    messageChunk: ChatMessageChunk
  },
  remove: {
    message: RemoveMessage,
    messageChunk: RemoveMessage
    // RemoveMessage does not have a chunk class.
  }
};
function _switchTypeToMessage(messageType, fields, returnChunk) {
  let chunk;
  let msg;
  switch (messageType) {
    case "human":
      if (returnChunk) {
        chunk = new HumanMessageChunk(fields);
      } else {
        msg = new HumanMessage(fields);
      }
      break;
    case "ai":
      if (returnChunk) {
        let aiChunkFields = {
          ...fields
        };
        if ("tool_calls" in aiChunkFields) {
          aiChunkFields = {
            ...aiChunkFields,
            tool_call_chunks: aiChunkFields.tool_calls?.map((tc) => ({
              ...tc,
              type: "tool_call_chunk",
              index: void 0,
              args: JSON.stringify(tc.args)
            }))
          };
        }
        chunk = new AIMessageChunk(aiChunkFields);
      } else {
        msg = new AIMessage(fields);
      }
      break;
    case "system":
      if (returnChunk) {
        chunk = new SystemMessageChunk(fields);
      } else {
        msg = new SystemMessage(fields);
      }
      break;
    case "developer":
      if (returnChunk) {
        chunk = new SystemMessageChunk({
          ...fields,
          additional_kwargs: {
            ...fields.additional_kwargs,
            __openai_role__: "developer"
          }
        });
      } else {
        msg = new SystemMessage({
          ...fields,
          additional_kwargs: {
            ...fields.additional_kwargs,
            __openai_role__: "developer"
          }
        });
      }
      break;
    case "tool":
      if ("tool_call_id" in fields) {
        if (returnChunk) {
          chunk = new ToolMessageChunk(fields);
        } else {
          msg = new ToolMessage(fields);
        }
      } else {
        throw new Error("Can not convert ToolMessage to ToolMessageChunk if 'tool_call_id' field is not defined.");
      }
      break;
    case "function":
      if (returnChunk) {
        chunk = new FunctionMessageChunk(fields);
      } else {
        if (!fields.name) {
          throw new Error("FunctionMessage must have a 'name' field");
        }
        msg = new FunctionMessage(fields);
      }
      break;
    case "generic":
      if ("role" in fields) {
        if (returnChunk) {
          chunk = new ChatMessageChunk(fields);
        } else {
          msg = new ChatMessage(fields);
        }
      } else {
        throw new Error("Can not convert ChatMessage to ChatMessageChunk if 'role' field is not defined.");
      }
      break;
    default:
      throw new Error(`Unrecognized message type ${messageType}`);
  }
  if (returnChunk && chunk) {
    return chunk;
  }
  if (msg) {
    return msg;
  }
  throw new Error(`Unrecognized message type ${messageType}`);
}
function _chunkToMsg(chunk) {
  const chunkType = chunk.getType();
  let msg;
  const fields = Object.fromEntries(Object.entries(chunk).filter(([k]) => !["type", "tool_call_chunks"].includes(k) && !k.startsWith("lc_")));
  if (chunkType in _MSG_CHUNK_MAP) {
    msg = _switchTypeToMessage(chunkType, fields);
  }
  if (!msg) {
    throw new Error(`Unrecognized message chunk class ${chunkType}. Supported classes are ${Object.keys(_MSG_CHUNK_MAP)}`);
  }
  return msg;
}
function defaultTextSplitter(text) {
  const splits = text.split("\n");
  return Promise.resolve([
    ...splits.slice(0, -1).map((s) => `${s}
`),
    splits[splits.length - 1]
  ]);
}

// ../../../node_modules/.pnpm/@langchain+core@0.3.61_@opentelemetry+api@1.9.0_@opentelemetry+exporter-trace-otlp-prot_0b0ad8d1f102d40fa2004ef9b372cb09/node_modules/@langchain/core/dist/prompts/image.js
init_esm();
var ImagePromptTemplate = class _ImagePromptTemplate extends BasePromptTemplate {
  static lc_name() {
    return "ImagePromptTemplate";
  }
  constructor(input) {
    super(input);
    Object.defineProperty(this, "lc_namespace", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ["langchain_core", "prompts", "image"]
    });
    Object.defineProperty(this, "template", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "templateFormat", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "f-string"
    });
    Object.defineProperty(this, "validateTemplate", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: true
    });
    Object.defineProperty(this, "additionalContentFields", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.template = input.template;
    this.templateFormat = input.templateFormat ?? this.templateFormat;
    this.validateTemplate = input.validateTemplate ?? this.validateTemplate;
    this.additionalContentFields = input.additionalContentFields;
    if (this.validateTemplate) {
      let totalInputVariables = this.inputVariables;
      if (this.partialVariables) {
        totalInputVariables = totalInputVariables.concat(Object.keys(this.partialVariables));
      }
      checkValidTemplate([
        { type: "image_url", image_url: this.template }
      ], this.templateFormat, totalInputVariables);
    }
  }
  _getPromptType() {
    return "prompt";
  }
  /**
   * Partially applies values to the prompt template.
   * @param values The values to be partially applied to the prompt template.
   * @returns A new instance of ImagePromptTemplate with the partially applied values.
   */
  async partial(values) {
    const newInputVariables = this.inputVariables.filter((iv) => !(iv in values));
    const newPartialVariables = {
      ...this.partialVariables ?? {},
      ...values
    };
    const promptDict = {
      ...this,
      inputVariables: newInputVariables,
      partialVariables: newPartialVariables
    };
    return new _ImagePromptTemplate(promptDict);
  }
  /**
   * Formats the prompt template with the provided values.
   * @param values The values to be used to format the prompt template.
   * @returns A promise that resolves to a string which is the formatted prompt.
   */
  async format(values) {
    const formatted = {};
    for (const [key, value] of Object.entries(this.template)) {
      if (typeof value === "string") {
        formatted[key] = renderTemplate(value, this.templateFormat, values);
      } else {
        formatted[key] = value;
      }
    }
    const url = values.url || formatted.url;
    const detail = values.detail || formatted.detail;
    if (!url) {
      throw new Error("Must provide either an image URL.");
    }
    if (typeof url !== "string") {
      throw new Error("url must be a string.");
    }
    const output = { url };
    if (detail) {
      output.detail = detail;
    }
    return output;
  }
  /**
   * Formats the prompt given the input values and returns a formatted
   * prompt value.
   * @param values The input values to format the prompt.
   * @returns A Promise that resolves to a formatted prompt value.
   */
  async formatPromptValue(values) {
    const formattedPrompt = await this.format(values);
    return new ImagePromptValue(formattedPrompt);
  }
};

// ../../../node_modules/.pnpm/@langchain+core@0.3.61_@opentelemetry+api@1.9.0_@opentelemetry+exporter-trace-otlp-prot_0b0ad8d1f102d40fa2004ef9b372cb09/node_modules/@langchain/core/dist/prompts/dict.js
init_esm();
var DictPromptTemplate = class extends Runnable {
  static lc_name() {
    return "DictPromptTemplate";
  }
  constructor(fields) {
    const templateFormat = fields.templateFormat ?? "f-string";
    const inputVariables = _getInputVariables(fields.template, templateFormat);
    super({ inputVariables, ...fields });
    Object.defineProperty(this, "lc_namespace", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ["langchain_core", "prompts", "dict"]
    });
    Object.defineProperty(this, "lc_serializable", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: true
    });
    Object.defineProperty(this, "template", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "templateFormat", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "inputVariables", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.template = fields.template;
    this.templateFormat = templateFormat;
    this.inputVariables = inputVariables;
  }
  async format(values) {
    return _insertInputVariables(this.template, values, this.templateFormat);
  }
  async invoke(values) {
    return await this._callWithConfig(this.format.bind(this), values, {
      runType: "prompt"
    });
  }
};
function _getInputVariables(template, templateFormat) {
  const inputVariables = [];
  for (const v of Object.values(template)) {
    if (typeof v === "string") {
      parseTemplate(v, templateFormat).forEach((t) => {
        if (t.type === "variable") {
          inputVariables.push(t.name);
        }
      });
    } else if (Array.isArray(v)) {
      for (const x of v) {
        if (typeof x === "string") {
          parseTemplate(x, templateFormat).forEach((t) => {
            if (t.type === "variable") {
              inputVariables.push(t.name);
            }
          });
        } else if (typeof x === "object") {
          inputVariables.push(..._getInputVariables(x, templateFormat));
        }
      }
    } else if (typeof v === "object" && v !== null) {
      inputVariables.push(..._getInputVariables(v, templateFormat));
    }
  }
  return Array.from(new Set(inputVariables));
}
function _insertInputVariables(template, inputs, templateFormat) {
  const formatted = {};
  for (const [k, v] of Object.entries(template)) {
    if (typeof v === "string") {
      formatted[k] = renderTemplate(v, templateFormat, inputs);
    } else if (Array.isArray(v)) {
      const formattedV = [];
      for (const x of v) {
        if (typeof x === "string") {
          formattedV.push(renderTemplate(x, templateFormat, inputs));
        } else if (typeof x === "object") {
          formattedV.push(_insertInputVariables(x, inputs, templateFormat));
        }
      }
      formatted[k] = formattedV;
    } else if (typeof v === "object" && v !== null) {
      formatted[k] = _insertInputVariables(v, inputs, templateFormat);
    } else {
      formatted[k] = v;
    }
  }
  return formatted;
}

// ../../../node_modules/.pnpm/@langchain+core@0.3.61_@opentelemetry+api@1.9.0_@opentelemetry+exporter-trace-otlp-prot_0b0ad8d1f102d40fa2004ef9b372cb09/node_modules/@langchain/core/dist/prompts/chat.js
var BaseMessagePromptTemplate = class extends Runnable {
  constructor() {
    super(...arguments);
    Object.defineProperty(this, "lc_namespace", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ["langchain_core", "prompts", "chat"]
    });
    Object.defineProperty(this, "lc_serializable", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: true
    });
  }
  /**
   * Calls the formatMessages method with the provided input and options.
   * @param input Input for the formatMessages method
   * @param options Optional BaseCallbackConfig
   * @returns Formatted output messages
   */
  async invoke(input, options) {
    return this._callWithConfig((input2) => this.formatMessages(input2), input, { ...options, runType: "prompt" });
  }
};
var MessagesPlaceholder = class extends BaseMessagePromptTemplate {
  static lc_name() {
    return "MessagesPlaceholder";
  }
  constructor(fields) {
    if (typeof fields === "string") {
      fields = { variableName: fields };
    }
    super(fields);
    Object.defineProperty(this, "variableName", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "optional", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.variableName = fields.variableName;
    this.optional = fields.optional ?? false;
  }
  get inputVariables() {
    return [this.variableName];
  }
  async formatMessages(values) {
    const input = values[this.variableName];
    if (this.optional && !input) {
      return [];
    } else if (!input) {
      const error = new Error(`Field "${this.variableName}" in prompt uses a MessagesPlaceholder, which expects an array of BaseMessages as an input value. Received: undefined`);
      error.name = "InputFormatError";
      throw error;
    }
    let formattedMessages;
    try {
      if (Array.isArray(input)) {
        formattedMessages = input.map(coerceMessageLikeToMessage);
      } else {
        formattedMessages = [coerceMessageLikeToMessage(input)];
      }
    } catch (e) {
      const readableInput = typeof input === "string" ? input : JSON.stringify(input, null, 2);
      const error = new Error([
        `Field "${this.variableName}" in prompt uses a MessagesPlaceholder, which expects an array of BaseMessages or coerceable values as input.`,
        `Received value: ${readableInput}`,
        `Additional message: ${e.message}`
      ].join("\n\n"));
      error.name = "InputFormatError";
      error.lc_error_code = e.lc_error_code;
      throw error;
    }
    return formattedMessages;
  }
};
var BaseMessageStringPromptTemplate = class extends BaseMessagePromptTemplate {
  constructor(fields) {
    if (!("prompt" in fields)) {
      fields = { prompt: fields };
    }
    super(fields);
    Object.defineProperty(this, "prompt", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.prompt = fields.prompt;
  }
  get inputVariables() {
    return this.prompt.inputVariables;
  }
  async formatMessages(values) {
    return [await this.format(values)];
  }
};
var BaseChatPromptTemplate = class extends BasePromptTemplate {
  constructor(input) {
    super(input);
  }
  async format(values) {
    return (await this.formatPromptValue(values)).toString();
  }
  async formatPromptValue(values) {
    const resultMessages = await this.formatMessages(values);
    return new ChatPromptValue(resultMessages);
  }
};
var ChatMessagePromptTemplate = class extends BaseMessageStringPromptTemplate {
  static lc_name() {
    return "ChatMessagePromptTemplate";
  }
  constructor(fields, role) {
    if (!("prompt" in fields)) {
      fields = { prompt: fields, role };
    }
    super(fields);
    Object.defineProperty(this, "role", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.role = fields.role;
  }
  async format(values) {
    return new ChatMessage(await this.prompt.format(values), this.role);
  }
  static fromTemplate(template, role, options) {
    return new this(PromptTemplate.fromTemplate(template, {
      templateFormat: options?.templateFormat
    }), role);
  }
};
function isTextTemplateParam(param) {
  if (param === null || typeof param !== "object" || Array.isArray(param)) {
    return false;
  }
  return Object.keys(param).length === 1 && "text" in param && typeof param.text === "string";
}
function isImageTemplateParam(param) {
  if (param === null || typeof param !== "object" || Array.isArray(param)) {
    return false;
  }
  return "image_url" in param && (typeof param.image_url === "string" || typeof param.image_url === "object" && param.image_url !== null && "url" in param.image_url && typeof param.image_url.url === "string");
}
var _StringImageMessagePromptTemplate = class extends BaseMessagePromptTemplate {
  static _messageClass() {
    throw new Error("Can not invoke _messageClass from inside _StringImageMessagePromptTemplate");
  }
  constructor(fields, additionalOptions) {
    if (!("prompt" in fields)) {
      fields = { prompt: fields };
    }
    super(fields);
    Object.defineProperty(this, "lc_namespace", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ["langchain_core", "prompts", "chat"]
    });
    Object.defineProperty(this, "lc_serializable", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: true
    });
    Object.defineProperty(this, "inputVariables", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "additionalOptions", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: {}
    });
    Object.defineProperty(this, "prompt", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "messageClass", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "chatMessageClass", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.prompt = fields.prompt;
    if (Array.isArray(this.prompt)) {
      let inputVariables = [];
      this.prompt.forEach((prompt) => {
        if ("inputVariables" in prompt) {
          inputVariables = inputVariables.concat(prompt.inputVariables);
        }
      });
      this.inputVariables = inputVariables;
    } else {
      this.inputVariables = this.prompt.inputVariables;
    }
    this.additionalOptions = additionalOptions ?? this.additionalOptions;
  }
  createMessage(content) {
    const constructor = this.constructor;
    if (constructor._messageClass()) {
      const MsgClass = constructor._messageClass();
      return new MsgClass({ content });
    } else if (constructor.chatMessageClass) {
      const MsgClass = constructor.chatMessageClass();
      return new MsgClass({
        content,
        role: this.getRoleFromMessageClass(MsgClass.lc_name())
      });
    } else {
      throw new Error("No message class defined");
    }
  }
  getRoleFromMessageClass(name) {
    switch (name) {
      case "HumanMessage":
        return "human";
      case "AIMessage":
        return "ai";
      case "SystemMessage":
        return "system";
      case "ChatMessage":
        return "chat";
      default:
        throw new Error("Invalid message class name");
    }
  }
  static fromTemplate(template, additionalOptions) {
    if (typeof template === "string") {
      return new this(PromptTemplate.fromTemplate(template, additionalOptions));
    }
    const prompt = [];
    for (const item of template) {
      if (typeof item === "string") {
        prompt.push(PromptTemplate.fromTemplate(item, additionalOptions));
      } else if (item === null) {
      } else if (isTextTemplateParam(item)) {
        let text = "";
        if (typeof item.text === "string") {
          text = item.text ?? "";
        }
        const options = {
          ...additionalOptions,
          additionalContentFields: item
        };
        prompt.push(PromptTemplate.fromTemplate(text, options));
      } else if (isImageTemplateParam(item)) {
        let imgTemplate = item.image_url ?? "";
        let imgTemplateObject;
        let inputVariables = [];
        if (typeof imgTemplate === "string") {
          let parsedTemplate;
          if (additionalOptions?.templateFormat === "mustache") {
            parsedTemplate = parseMustache(imgTemplate);
          } else {
            parsedTemplate = parseFString(imgTemplate);
          }
          const variables = parsedTemplate.flatMap((item2) => item2.type === "variable" ? [item2.name] : []);
          if ((variables?.length ?? 0) > 0) {
            if (variables.length > 1) {
              throw new Error(`Only one format variable allowed per image template.
Got: ${variables}
From: ${imgTemplate}`);
            }
            inputVariables = [variables[0]];
          } else {
            inputVariables = [];
          }
          imgTemplate = { url: imgTemplate };
          imgTemplateObject = new ImagePromptTemplate({
            template: imgTemplate,
            inputVariables,
            templateFormat: additionalOptions?.templateFormat,
            additionalContentFields: item
          });
        } else if (typeof imgTemplate === "object") {
          if ("url" in imgTemplate) {
            let parsedTemplate;
            if (additionalOptions?.templateFormat === "mustache") {
              parsedTemplate = parseMustache(imgTemplate.url);
            } else {
              parsedTemplate = parseFString(imgTemplate.url);
            }
            inputVariables = parsedTemplate.flatMap((item2) => item2.type === "variable" ? [item2.name] : []);
          } else {
            inputVariables = [];
          }
          imgTemplateObject = new ImagePromptTemplate({
            template: imgTemplate,
            inputVariables,
            templateFormat: additionalOptions?.templateFormat,
            additionalContentFields: item
          });
        } else {
          throw new Error("Invalid image template");
        }
        prompt.push(imgTemplateObject);
      } else if (typeof item === "object") {
        prompt.push(new DictPromptTemplate({
          template: item,
          templateFormat: additionalOptions?.templateFormat
        }));
      }
    }
    return new this({ prompt, additionalOptions });
  }
  async format(input) {
    if (this.prompt instanceof BaseStringPromptTemplate) {
      const text = await this.prompt.format(input);
      return this.createMessage(text);
    } else {
      const content = [];
      for (const prompt of this.prompt) {
        let inputs = {};
        if (!("inputVariables" in prompt)) {
          throw new Error(`Prompt ${prompt} does not have inputVariables defined.`);
        }
        for (const item of prompt.inputVariables) {
          if (!inputs) {
            inputs = { [item]: input[item] };
          }
          inputs = { ...inputs, [item]: input[item] };
        }
        if (prompt instanceof BaseStringPromptTemplate) {
          const formatted = await prompt.format(inputs);
          let additionalContentFields;
          if ("additionalContentFields" in prompt) {
            additionalContentFields = prompt.additionalContentFields;
          }
          content.push({
            ...additionalContentFields,
            type: "text",
            text: formatted
          });
        } else if (prompt instanceof ImagePromptTemplate) {
          const formatted = await prompt.format(inputs);
          let additionalContentFields;
          if ("additionalContentFields" in prompt) {
            additionalContentFields = prompt.additionalContentFields;
          }
          content.push({
            ...additionalContentFields,
            type: "image_url",
            image_url: formatted
          });
        } else if (prompt instanceof DictPromptTemplate) {
          const formatted = await prompt.format(inputs);
          let additionalContentFields;
          if ("additionalContentFields" in prompt) {
            additionalContentFields = prompt.additionalContentFields;
          }
          content.push({
            ...additionalContentFields,
            ...formatted
          });
        }
      }
      return this.createMessage(content);
    }
  }
  async formatMessages(values) {
    return [await this.format(values)];
  }
};
var HumanMessagePromptTemplate = class extends _StringImageMessagePromptTemplate {
  static _messageClass() {
    return HumanMessage;
  }
  static lc_name() {
    return "HumanMessagePromptTemplate";
  }
};
var AIMessagePromptTemplate = class extends _StringImageMessagePromptTemplate {
  static _messageClass() {
    return AIMessage;
  }
  static lc_name() {
    return "AIMessagePromptTemplate";
  }
};
var SystemMessagePromptTemplate = class extends _StringImageMessagePromptTemplate {
  static _messageClass() {
    return SystemMessage;
  }
  static lc_name() {
    return "SystemMessagePromptTemplate";
  }
};
function _isBaseMessagePromptTemplate(baseMessagePromptTemplateLike) {
  return typeof baseMessagePromptTemplateLike.formatMessages === "function";
}
function _coerceMessagePromptTemplateLike(messagePromptTemplateLike, extra) {
  if (_isBaseMessagePromptTemplate(messagePromptTemplateLike) || isBaseMessage(messagePromptTemplateLike)) {
    return messagePromptTemplateLike;
  }
  if (Array.isArray(messagePromptTemplateLike) && messagePromptTemplateLike[0] === "placeholder") {
    const messageContent = messagePromptTemplateLike[1];
    if (extra?.templateFormat === "mustache" && typeof messageContent === "string" && messageContent.slice(0, 2) === "{{" && messageContent.slice(-2) === "}}") {
      const variableName = messageContent.slice(2, -2);
      return new MessagesPlaceholder({ variableName, optional: true });
    } else if (typeof messageContent === "string" && messageContent[0] === "{" && messageContent[messageContent.length - 1] === "}") {
      const variableName = messageContent.slice(1, -1);
      return new MessagesPlaceholder({ variableName, optional: true });
    }
    throw new Error(`Invalid placeholder template for format ${extra?.templateFormat ?? `"f-string"`}: "${messagePromptTemplateLike[1]}". Expected a variable name surrounded by ${extra?.templateFormat === "mustache" ? "double" : "single"} curly braces.`);
  }
  const message = coerceMessageLikeToMessage(messagePromptTemplateLike);
  let templateData;
  if (typeof message.content === "string") {
    templateData = message.content;
  } else {
    templateData = message.content.map((item) => {
      if ("text" in item) {
        return { ...item, text: item.text };
      } else if ("image_url" in item) {
        return { ...item, image_url: item.image_url };
      } else {
        return item;
      }
    });
  }
  if (message._getType() === "human") {
    return HumanMessagePromptTemplate.fromTemplate(templateData, extra);
  } else if (message._getType() === "ai") {
    return AIMessagePromptTemplate.fromTemplate(templateData, extra);
  } else if (message._getType() === "system") {
    return SystemMessagePromptTemplate.fromTemplate(templateData, extra);
  } else if (ChatMessage.isInstance(message)) {
    return ChatMessagePromptTemplate.fromTemplate(message.content, message.role, extra);
  } else {
    throw new Error(`Could not coerce message prompt template from input. Received message type: "${message._getType()}".`);
  }
}
function isMessagesPlaceholder(x) {
  return x.constructor.lc_name() === "MessagesPlaceholder";
}
var ChatPromptTemplate = class _ChatPromptTemplate extends BaseChatPromptTemplate {
  static lc_name() {
    return "ChatPromptTemplate";
  }
  get lc_aliases() {
    return {
      promptMessages: "messages"
    };
  }
  constructor(input) {
    super(input);
    Object.defineProperty(this, "promptMessages", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "validateTemplate", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: true
    });
    Object.defineProperty(this, "templateFormat", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "f-string"
    });
    if (input.templateFormat === "mustache" && input.validateTemplate === void 0) {
      this.validateTemplate = false;
    }
    Object.assign(this, input);
    if (this.validateTemplate) {
      const inputVariablesMessages = /* @__PURE__ */ new Set();
      for (const promptMessage of this.promptMessages) {
        if (promptMessage instanceof BaseMessage)
          continue;
        for (const inputVariable of promptMessage.inputVariables) {
          inputVariablesMessages.add(inputVariable);
        }
      }
      const totalInputVariables = this.inputVariables;
      const inputVariablesInstance = new Set(this.partialVariables ? totalInputVariables.concat(Object.keys(this.partialVariables)) : totalInputVariables);
      const difference = new Set([...inputVariablesInstance].filter((x) => !inputVariablesMessages.has(x)));
      if (difference.size > 0) {
        throw new Error(`Input variables \`${[
          ...difference
        ]}\` are not used in any of the prompt messages.`);
      }
      const otherDifference = new Set([...inputVariablesMessages].filter((x) => !inputVariablesInstance.has(x)));
      if (otherDifference.size > 0) {
        throw new Error(`Input variables \`${[
          ...otherDifference
        ]}\` are used in prompt messages but not in the prompt template.`);
      }
    }
  }
  _getPromptType() {
    return "chat";
  }
  async _parseImagePrompts(message, inputValues) {
    if (typeof message.content === "string") {
      return message;
    }
    const formattedMessageContent = await Promise.all(message.content.map(async (item) => {
      if (item.type !== "image_url") {
        return item;
      }
      let imageUrl = "";
      if (typeof item.image_url === "string") {
        imageUrl = item.image_url;
      } else {
        imageUrl = item.image_url.url;
      }
      const promptTemplatePlaceholder = PromptTemplate.fromTemplate(imageUrl, {
        templateFormat: this.templateFormat
      });
      const formattedUrl = await promptTemplatePlaceholder.format(inputValues);
      if (typeof item.image_url !== "string" && "url" in item.image_url) {
        item.image_url.url = formattedUrl;
      } else {
        item.image_url = formattedUrl;
      }
      return item;
    }));
    message.content = formattedMessageContent;
    return message;
  }
  async formatMessages(values) {
    const allValues = await this.mergePartialAndUserVariables(values);
    let resultMessages = [];
    for (const promptMessage of this.promptMessages) {
      if (promptMessage instanceof BaseMessage) {
        resultMessages.push(await this._parseImagePrompts(promptMessage, allValues));
      } else {
        const inputValues = promptMessage.inputVariables.reduce((acc, inputVariable) => {
          if (!(inputVariable in allValues) && !(isMessagesPlaceholder(promptMessage) && promptMessage.optional)) {
            const error = addLangChainErrorFields(new Error(`Missing value for input variable \`${inputVariable.toString()}\``), "INVALID_PROMPT_INPUT");
            throw error;
          }
          acc[inputVariable] = allValues[inputVariable];
          return acc;
        }, {});
        const message = await promptMessage.formatMessages(inputValues);
        resultMessages = resultMessages.concat(message);
      }
    }
    return resultMessages;
  }
  async partial(values) {
    const newInputVariables = this.inputVariables.filter((iv) => !(iv in values));
    const newPartialVariables = {
      ...this.partialVariables ?? {},
      ...values
    };
    const promptDict = {
      ...this,
      inputVariables: newInputVariables,
      partialVariables: newPartialVariables
    };
    return new _ChatPromptTemplate(promptDict);
  }
  static fromTemplate(template, options) {
    const prompt = PromptTemplate.fromTemplate(template, options);
    const humanTemplate = new HumanMessagePromptTemplate({ prompt });
    return this.fromMessages([humanTemplate]);
  }
  /**
   * Create a chat model-specific prompt from individual chat messages
   * or message-like tuples.
   * @param promptMessages Messages to be passed to the chat model
   * @returns A new ChatPromptTemplate
   */
  static fromMessages(promptMessages, extra) {
    const flattenedMessages = promptMessages.reduce((acc, promptMessage) => acc.concat(
      // eslint-disable-next-line no-instanceof/no-instanceof
      promptMessage instanceof _ChatPromptTemplate ? promptMessage.promptMessages : [
        _coerceMessagePromptTemplateLike(promptMessage, extra)
      ]
    ), []);
    const flattenedPartialVariables = promptMessages.reduce((acc, promptMessage) => (
      // eslint-disable-next-line no-instanceof/no-instanceof
      promptMessage instanceof _ChatPromptTemplate ? Object.assign(acc, promptMessage.partialVariables) : acc
    ), /* @__PURE__ */ Object.create(null));
    const inputVariables = /* @__PURE__ */ new Set();
    for (const promptMessage of flattenedMessages) {
      if (promptMessage instanceof BaseMessage)
        continue;
      for (const inputVariable of promptMessage.inputVariables) {
        if (inputVariable in flattenedPartialVariables) {
          continue;
        }
        inputVariables.add(inputVariable);
      }
    }
    return new this({
      ...extra,
      inputVariables: [...inputVariables],
      promptMessages: flattenedMessages,
      partialVariables: flattenedPartialVariables,
      templateFormat: extra?.templateFormat
    });
  }
  /** @deprecated Renamed to .fromMessages */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromPromptMessages(promptMessages) {
    return this.fromMessages(promptMessages);
  }
};

// ../../../node_modules/.pnpm/@langchain+core@0.3.61_@opentelemetry+api@1.9.0_@opentelemetry+exporter-trace-otlp-prot_0b0ad8d1f102d40fa2004ef9b372cb09/node_modules/@langchain/core/dist/prompts/few_shot.js
var FewShotPromptTemplate = class _FewShotPromptTemplate extends BaseStringPromptTemplate {
  constructor(input) {
    super(input);
    Object.defineProperty(this, "lc_serializable", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "examples", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "exampleSelector", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "examplePrompt", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "suffix", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ""
    });
    Object.defineProperty(this, "exampleSeparator", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "\n\n"
    });
    Object.defineProperty(this, "prefix", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ""
    });
    Object.defineProperty(this, "templateFormat", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "f-string"
    });
    Object.defineProperty(this, "validateTemplate", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: true
    });
    Object.assign(this, input);
    if (this.examples !== void 0 && this.exampleSelector !== void 0) {
      throw new Error("Only one of 'examples' and 'example_selector' should be provided");
    }
    if (this.examples === void 0 && this.exampleSelector === void 0) {
      throw new Error("One of 'examples' and 'example_selector' should be provided");
    }
    if (this.validateTemplate) {
      let totalInputVariables = this.inputVariables;
      if (this.partialVariables) {
        totalInputVariables = totalInputVariables.concat(Object.keys(this.partialVariables));
      }
      checkValidTemplate(this.prefix + this.suffix, this.templateFormat, totalInputVariables);
    }
  }
  _getPromptType() {
    return "few_shot";
  }
  static lc_name() {
    return "FewShotPromptTemplate";
  }
  async getExamples(inputVariables) {
    if (this.examples !== void 0) {
      return this.examples;
    }
    if (this.exampleSelector !== void 0) {
      return this.exampleSelector.selectExamples(inputVariables);
    }
    throw new Error("One of 'examples' and 'example_selector' should be provided");
  }
  async partial(values) {
    const newInputVariables = this.inputVariables.filter((iv) => !(iv in values));
    const newPartialVariables = {
      ...this.partialVariables ?? {},
      ...values
    };
    const promptDict = {
      ...this,
      inputVariables: newInputVariables,
      partialVariables: newPartialVariables
    };
    return new _FewShotPromptTemplate(promptDict);
  }
  /**
   * Formats the prompt with the given values.
   * @param values The values to format the prompt with.
   * @returns A promise that resolves to a string representing the formatted prompt.
   */
  async format(values) {
    const allValues = await this.mergePartialAndUserVariables(values);
    const examples = await this.getExamples(allValues);
    const exampleStrings = await Promise.all(examples.map((example) => this.examplePrompt.format(example)));
    const template = [this.prefix, ...exampleStrings, this.suffix].join(this.exampleSeparator);
    return renderTemplate(template, this.templateFormat, allValues);
  }
  serialize() {
    if (this.exampleSelector || !this.examples) {
      throw new Error("Serializing an example selector is not currently supported");
    }
    if (this.outputParser !== void 0) {
      throw new Error("Serializing an output parser is not currently supported");
    }
    return {
      _type: this._getPromptType(),
      input_variables: this.inputVariables,
      example_prompt: this.examplePrompt.serialize(),
      example_separator: this.exampleSeparator,
      suffix: this.suffix,
      prefix: this.prefix,
      template_format: this.templateFormat,
      examples: this.examples
    };
  }
  static async deserialize(data) {
    const { example_prompt } = data;
    if (!example_prompt) {
      throw new Error("Missing example prompt");
    }
    const examplePrompt = await PromptTemplate.deserialize(example_prompt);
    let examples;
    if (Array.isArray(data.examples)) {
      examples = data.examples;
    } else {
      throw new Error("Invalid examples format. Only list or string are supported.");
    }
    return new _FewShotPromptTemplate({
      inputVariables: data.input_variables,
      examplePrompt,
      examples,
      exampleSeparator: data.example_separator,
      prefix: data.prefix,
      suffix: data.suffix,
      templateFormat: data.template_format
    });
  }
};
var FewShotChatMessagePromptTemplate = class _FewShotChatMessagePromptTemplate extends BaseChatPromptTemplate {
  _getPromptType() {
    return "few_shot_chat";
  }
  static lc_name() {
    return "FewShotChatMessagePromptTemplate";
  }
  constructor(fields) {
    super(fields);
    Object.defineProperty(this, "lc_serializable", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: true
    });
    Object.defineProperty(this, "examples", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "exampleSelector", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "examplePrompt", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "suffix", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ""
    });
    Object.defineProperty(this, "exampleSeparator", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "\n\n"
    });
    Object.defineProperty(this, "prefix", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ""
    });
    Object.defineProperty(this, "templateFormat", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "f-string"
    });
    Object.defineProperty(this, "validateTemplate", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: true
    });
    this.examples = fields.examples;
    this.examplePrompt = fields.examplePrompt;
    this.exampleSeparator = fields.exampleSeparator ?? "\n\n";
    this.exampleSelector = fields.exampleSelector;
    this.prefix = fields.prefix ?? "";
    this.suffix = fields.suffix ?? "";
    this.templateFormat = fields.templateFormat ?? "f-string";
    this.validateTemplate = fields.validateTemplate ?? true;
    if (this.examples !== void 0 && this.exampleSelector !== void 0) {
      throw new Error("Only one of 'examples' and 'example_selector' should be provided");
    }
    if (this.examples === void 0 && this.exampleSelector === void 0) {
      throw new Error("One of 'examples' and 'example_selector' should be provided");
    }
    if (this.validateTemplate) {
      let totalInputVariables = this.inputVariables;
      if (this.partialVariables) {
        totalInputVariables = totalInputVariables.concat(Object.keys(this.partialVariables));
      }
      checkValidTemplate(this.prefix + this.suffix, this.templateFormat, totalInputVariables);
    }
  }
  async getExamples(inputVariables) {
    if (this.examples !== void 0) {
      return this.examples;
    }
    if (this.exampleSelector !== void 0) {
      return this.exampleSelector.selectExamples(inputVariables);
    }
    throw new Error("One of 'examples' and 'example_selector' should be provided");
  }
  /**
   * Formats the list of values and returns a list of formatted messages.
   * @param values The values to format the prompt with.
   * @returns A promise that resolves to a string representing the formatted prompt.
   */
  async formatMessages(values) {
    const allValues = await this.mergePartialAndUserVariables(values);
    let examples = await this.getExamples(allValues);
    examples = examples.map((example) => {
      const result = {};
      this.examplePrompt.inputVariables.forEach((inputVariable) => {
        result[inputVariable] = example[inputVariable];
      });
      return result;
    });
    const messages = [];
    for (const example of examples) {
      const exampleMessages = await this.examplePrompt.formatMessages(example);
      messages.push(...exampleMessages);
    }
    return messages;
  }
  /**
   * Formats the prompt with the given values.
   * @param values The values to format the prompt with.
   * @returns A promise that resolves to a string representing the formatted prompt.
   */
  async format(values) {
    const allValues = await this.mergePartialAndUserVariables(values);
    const examples = await this.getExamples(allValues);
    const exampleMessages = await Promise.all(examples.map((example) => this.examplePrompt.formatMessages(example)));
    const exampleStrings = exampleMessages.flat().map((message) => message.content);
    const template = [this.prefix, ...exampleStrings, this.suffix].join(this.exampleSeparator);
    return renderTemplate(template, this.templateFormat, allValues);
  }
  /**
   * Partially formats the prompt with the given values.
   * @param values The values to partially format the prompt with.
   * @returns A promise that resolves to an instance of `FewShotChatMessagePromptTemplate` with the given values partially formatted.
   */
  async partial(values) {
    const newInputVariables = this.inputVariables.filter((variable) => !(variable in values));
    const newPartialVariables = {
      ...this.partialVariables ?? {},
      ...values
    };
    const promptDict = {
      ...this,
      inputVariables: newInputVariables,
      partialVariables: newPartialVariables
    };
    return new _FewShotChatMessagePromptTemplate(promptDict);
  }
};

export {
  messages_exports,
  ImagePromptTemplate,
  DictPromptTemplate,
  BaseMessagePromptTemplate,
  MessagesPlaceholder,
  BaseMessageStringPromptTemplate,
  BaseChatPromptTemplate,
  ChatMessagePromptTemplate,
  HumanMessagePromptTemplate,
  AIMessagePromptTemplate,
  SystemMessagePromptTemplate,
  ChatPromptTemplate,
  FewShotPromptTemplate,
  FewShotChatMessagePromptTemplate
};
//# sourceMappingURL=chunk-G47ZG56P.mjs.map
