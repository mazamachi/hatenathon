require 'sinatra'
require 'json'
require 'active_record'

# ActiveRecord::Base.configurations = YAML.load_file('database.yml')
# ActiveRecord::Base.establish_connection('development')
# # {"page": {"title":...}}ではなく{"title":...}を返す
#  ActiveRecord::Base.include_root_in_json = false
#
# class Page < ActiveRecord::Base
#   self.table_name = 'page'
# end

# get '/all' do
#   data = Page.all.select(:title, :date, :page_view)
#   return data.to_json
# end
#
# get '/date' do
#   data = Page.find_by(date: params[:date])
# end

get '/' do

end
