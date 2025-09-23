require 'bundler/inline'

gemfile(true) do
  source 'https://rubygems.org'
  gem 'activerecord', require: 'active_record'
  gem 'pg'
end

require 'active_record'
require 'logger'
require 'stringio'

ActiveRecord::Base.logger = Logger.new(STDOUT)

# URL で接続
ActiveRecord::Base.establish_connection(
  ENV['DATABASE_URL'] || 'postgresql://postgres:password@0.0.0.0:15432/development'
)

ActiveRecord::SchemaDumper.dump
