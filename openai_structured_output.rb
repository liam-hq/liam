#!/usr/bin/env ruby

require 'net/http'
require 'json'
require 'uri'

class OpenAIStructuredOutput
  def initialize(api_key = nil)
    @api_key = api_key || ENV['OPENAI_API_KEY']
    raise 'OPENAI_API_KEY environment variable is required' unless @api_key
  end

  def call(case_id)
    raise if case_id.nil?
    schema = {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "tables": {
          "type": "object",
          "additionalProperties": false,
          "patternProperties": {
            "^[a-zA-Z_][a-zA-Z0-9_]*$": {
              "type": "object",
              "required": ["name", "columns", "comment", "indexes", "constraints"],
              "additionalProperties": false,
              "properties": {
                "name": { "type": "string" },
                "columns": {
                  "type": "object",
                  "patternProperties": {
                    "^[a-zA-Z_][a-zA-Z0-9_]*$": {
                      "type": "object",
                      "properties": {
                        "name": { "type": "string" },
                        "type": { "type": "string" },
                        "default": { "type": ["string", "number", "null"] },
                        "check": { "type": ["string", "null"] },
                        "notNull": { "type": "boolean" },
                        "comment": { "type": ["string", "null"] }
                      },
                      "required": ["name", "type", "default", "check", "notNull", "comment"],
                      "additionalProperties": false
                    }
                  }
                },
                "comment": { "type": ["string", "null"] },
                "indexes": {
                  "type": "object",
                  "additionalProperties": false
                },
                "constraints": {
                  "type": "object",
                  "patternProperties": {
                    "^[a-zA-Z_][a-zA-Z0-9_]*$": {
                      "type": "object",
                      "anyOf": [
                        {
                          "properties": {
                            "type": { "const": "PRIMARY KEY" },
                            "name": { "type": "string" },
                            "columnNames": { 
                              "type": "array",
                              "items": { "type": "string" }
                            }
                          },
                          "required": ["type", "name", "columnNames"],
                          "additionalProperties": false
                        },
                        {
                          "properties": {
                            "type": { "const": "FOREIGN KEY" },
                            "name": { "type": "string" },
                            "columnName": { "type": "string" },
                            "targetTableName": { "type": "string" },
                            "targetColumnName": { "type": "string" },
                            "updateConstraint": {
                              "type": "string",
                              "enum": ["CASCADE", "RESTRICT", "SET_NULL", "SET_DEFAULT", "NO_ACTION"]
                            },
                            "deleteConstraint": {
                              "type": "string",
                              "enum": ["CASCADE", "RESTRICT", "SET_NULL", "SET_DEFAULT", "NO_ACTION"]
                            }
                          },
                          "required": ["type", "name", "columnName", "targetTableName", "targetColumnName", "updateConstraint", "deleteConstraint"],
                          "additionalProperties": false
                        },
                        {
                          "properties": {
                            "type": { "const": "UNIQUE" },
                            "name": { "type": "string" },
                            "columnNames": { 
                              "type": "array",
                              "items": { "type": "string" }
                            }
                          },
                          "required": ["type", "name", "columnNames"],
                          "additionalProperties": false
                        },
                        {
                          "properties": {
                            "type": { "const": "CHECK" },
                            "name": { "type": "string" },
                            "detail": { "type": "string" }
                          },
                          "required": ["type", "name", "detail"],
                          "additionalProperties": false
                        }
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    input_content = JSON.parse(File.read("./benchmark-workspace/execution/input/#{case_id}.json")).fetch('input')

    # リクエストボディ
    request_body = {
      # model: "gpt-4o-2024-08-06",
      model: "o4-mini",

      messages: [
        {
          role: "system",
          content: "You are a database schema expert. Please generate a database schema from the given text."
        },
        {
          role: "user",
          content: input_content,
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "db_schema",
          strict: true,
          schema: schema
        }
      },
      # temperature: 0.1
    }

    # HTTP リクエスト
    uri = URI('https://api.openai.com/v1/chat/completions')
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 6000

    request = Net::HTTP::Post.new(uri)
    request['Authorization'] = "Bearer #{@api_key}"
    request['Content-Type'] = 'application/json'
    request.body = request_body.to_json

    response = http.request(request)

    if response.code == '200'

      # header = response.header
      result = JSON.parse(response.body)
      content = JSON.parse(result['choices'][0]['message']['content'])
      
      display_results(content, case_id)
      # puts '-------'
      # puts header

      content
    else
      puts "エラーが発生しました: #{response.code}"
      puts response.body
      nil
    end
  end

  private

  def display_results(content, case_id)
    path = "./benchmark-workspace/execution/output/#{case_id}.json"
    File.write(path, JSON.pretty_generate(content))
  end
end

# 実行
if __FILE__ == $0
  begin
    client = OpenAIStructuredOutput.new
    case_id = ARGV.first
    client.call(case_id)
  rescue => e
    puts "エラー: #{e.message}"
    puts "エラー: #{e.backtrace}"
  end
end
