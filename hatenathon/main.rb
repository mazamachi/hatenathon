require 'sinatra'
require 'json'
require 'active_record'
require "sinatra/reloader"
load "./backend.rb"

get '/' do

end

get '/network' do
  if params[:id]
    create_network_json(params[:id])
  # else
  end
end

get '/example' do
  create_network_json("SWIMATH2",max_depth:params[:depth].to_i)
end
