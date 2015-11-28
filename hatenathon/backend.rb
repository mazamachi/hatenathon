require 'open-uri'
require 'json'
require 'uri'
require 'rss'
require 'cgi/util'
require 'parallel'

class User
  attr_accessor :user_name, :blog_url, :fans, :has_blog
  def initialize(user_name, do_search=true)
    @user_name = user_name
    @icon_url = "http://cdn1.www.st-hatena.com/users/#{@user_name[0..1]}/#{@user_name}/profile.gif"
    begin
      @blog_url = open("http://blog.hatena.ne.jp/#{@user_name}/").base_uri.to_s
    rescue
      return
    end
    if @blog_url.match("profile.hatena.ne.jp")
      @has_blog = false
      @blog_url = nil
      @blog_title = nil
    else
      @has_blog = true
    end
    self.search_blog if do_search
  end

  def search_blog
    if !@has_blog
      return
    end

    blog_rss = RSS::Parser.parse(blog_url + "feed",false)
    entries = blog_rss.items
    @blog_title = blog_rss.title.content

    @user_hash = {}
    @category_hash = {}
    sum_of_bookmarks = 0
    @num_of_entries = [entries.length, 10].min
    # TODO: 数変える
    Parallel.each(entries[0...@num_of_entries], in_threads:10) do |entry|
      response = open('http://b.hatena.ne.jp/entry/jsonlite/?url='+CGI.escape(entry.link.href))
      begin
        entry_json = JSON.parse(response.read)
      rescue
        next
      end
      # TODO: 数変える
      sum_of_bookmarks += entry_json["count"]
      next if entry_json["bookmarks"] == nil
      num_of_bookmarks = [entry_json["bookmarks"].length, 10].min
      entry_json["bookmarks"].sort_by{|b| b["timestamp"]}[0...num_of_bookmarks].each do |b|
        @user_hash[b["user"]] ||= 0
        @user_hash[b["user"]] += 1
      end
    end
    @bookmark_average = (@num_of_entries!=0) ? sum_of_bookmarks / @num_of_entries.to_f : 0

    return @user_hash
  end

  def create_user_hash
    # TODO: fast_generateに変更
    {
      blogTitle: @blog_title,
      blogURL: @blog_url,
      iconURL: @icon_url,
      bookmarkAverage: @bookmark_average
    }
  end

  def create_links_array
    self.generate_user_ratio_hash
    @user_ratio_hash.map{|fan_name,value| {
        target: @user_name,
        source: fan_name,
        bookmarkRate: value
      }
    }
  end

  def generate_user_ratio_hash(num=10)
    @user_hash.delete(@user_name)
    num_of_fans = [@user_hash.length, num].min
    @user_ratio_hash = @user_hash.to_a.sort_by{|user,value| value}.reverse[0...num_of_fans].map{|user,value| [user, value /= @num_of_entries.to_f] }.to_h
    @fans = @user_ratio_hash.keys
  end
end

def create_network_json(*user_names, max_depth:3)
  open_array = [*user_names]+ [[]]*(max_depth-1)
  user_hash = {}
  links = []
  (0...max_depth).each do |depth|
    STDERR.puts open_array[depth]
    Parallel.each(open_array[depth], in_threads:10) do |user_name|
      if user_hash[user_name] == nil
        STDERR.puts user_name
        user = User.new(user_name)
        user_hash[user_name] = user.create_user_hash
        next if !user.has_blog
        if depth<max_depth-1
          links += user.create_links_array
          open_array[depth+1] += user.fans
        end
      end
    end
  end
  return JSON::pretty_generate([{users:user_hash, links:links}])
end

# puts create_network_json(["SWIMATH2", "g-gourmedia", "keisolutions", "eaidem", "ikdhkr", "biogLife", "hazama19258370", "keikun028", "moarh", "Rosylife", "sugatareiji", "abberoad", "skky17", "buried_treasure"],max_depth:3)
