require 'open3'
require 'fileutils'
require 'pathname'

BASE_PATH = ENV['GITHUB_REPOS_PATH'] || File.expand_path('~/github')

def command(script)
  stdout, _, _ = Open3.capture3(script)
  stdout
end

LIST = {
  "langfuse/langfuse/pull/5672" => "b8d0a4bb",
  "langfuse/langfuse/pull/5656" => "18508187",
  "langfuse/langfuse/pull/5488" => "eb5ee957",
  "langfuse/langfuse/pull/5472" => "0ea80605",
  "langfuse/langfuse/pull/5471" => "05e16e7d",
  "langfuse/langfuse/pull/5381" => "123f5131",
  "langfuse/langfuse/pull/5197" => "9f20b3e1",
  "langfuse/langfuse/pull/5178" => "105284d7",
  "langfuse/langfuse/pull/5167" => "29f7ace2",
  "langfuse/langfuse/pull/5075" => "fcef737d",
  "langfuse/langfuse/pull/4946" => "93a0ab6f",
  "langfuse/langfuse/pull/4943" => "cf29c6b7",
  "langfuse/langfuse/pull/4612" => "816eec0f",
  "langfuse/langfuse/pull/4399" => "9a861dff",
  "langfuse/langfuse/pull/4086" => "8517670a",
  "langfuse/langfuse/pull/3989" => "633f76f6",
  "langfuse/langfuse/pull/4094" => "5efd4ec0",
  "langfuse/langfuse/pull/4031" => "2b89f62a",
  "langfuse/langfuse/pull/3955" => "c7546bca",
  "langfuse/langfuse/pull/3895" => "5897db38",
  "langfuse/langfuse/pull/3811" => "541765f8",
  "langfuse/langfuse/pull/3759" => "c97ed698",
  "langfuse/langfuse/pull/3711" => "39ce15aa",
  "langfuse/langfuse/pull/3499" => "c4fa31be",
  "langfuse/langfuse/pull/3651" => "237e539c",
  "langfuse/langfuse/pull/3377" => "66e15bcf",
  "langfuse/langfuse/pull/3356" => "2358264b",
  "langfuse/langfuse/pull/2971" => "159b5f87",
  "langfuse/langfuse/pull/2942" => "dc15b72f",
  "langfuse/langfuse/pull/2083" => "d8d2a3c0",
  "langfuse/langfuse/pull/2750" => "b123cc5a",
  "langfuse/langfuse/pull/2665" => "90fc9fb6",
  "langfuse/langfuse/pull/2651" => "2291ac66",
  "langfuse/langfuse/pull/2655" => "31a49688",
}

repo = 'langfuse/langfuse'

# diff
def diff(repo:, ref:)
  script = "git -C #{BASE_PATH}/#{repo} show #{ref}"
  command(script)
end

LIST.first(40).each do |pull_base, ref|
  number = pull_base.delete_prefix("#{repo}/pull/")
  FileUtils.mkdir_p("test-files/#{repo}/pr-#{number}/")
  _, _, body = diff(repo:, ref:).split("\n", 3)
  Pathname("test-files/#{repo}/pr-#{number}/diffs.txt").write(body)
end

# before_schema
def before_schema(repo:, ref:)
  script = "git -C #{BASE_PATH}/#{repo} show #{ref}^:packages/shared/prisma/schema.prisma"
  command(script)
end

LIST.first(40).each do |pull_base, ref|
  number = pull_base.delete_prefix("#{repo}/pull/")
  FileUtils.mkdir_p("test-files/#{repo}/pr-#{number}/")
  _, _, body = before_schema(repo:, ref:).split("\n", 3)
  Pathname("test-files/#{repo}/pr-#{number}/before_schema.txt").write(body)
end

