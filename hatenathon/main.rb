require 'sinatra'
require 'json'
require "sinatra/reloader"
require 'sinatra/cross_origin'

configure do
  enable :cross_origin
end

load "./backend.rb"

get '/' do

end

get '/network' do
  if params[:id]
    p params[:id]
    create_network_json(params[:id], max_depth:2, people:20)
  # else
  end
end

get '/example' do
  create_network_json("SWIMATH2",max_depth:params[:depth].to_i)
end
