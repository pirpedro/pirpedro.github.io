FROM jekyll/jekyll:4.0
LABEL maintainer="Pedro Rodrigues <pir.pedro@gmail.com"

RUN apk add --no-cache --virtual .build-deps \
        autoconf \
        libtool \
        nasm \
        automake \
        graphicsmagick
WORKDIR /srv/jekyll
COPY Gemfile Gemfile.lock ./
RUN bundle install --jobs 20 --retry 5

RUN pip install --upgrade pip \
        && pip3 install awscli \
         awscli-plugin-endpoint

CMD bundle exec jekyll build && bundle exec jekyll algolia  
