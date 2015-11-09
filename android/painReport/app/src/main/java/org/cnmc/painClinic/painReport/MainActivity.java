package org.cnmc.painClinic.painReport;


import android.app.AlarmManager;
import android.app.AlertDialog;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.ProgressDialog;
import android.content.BroadcastReceiver;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.os.Build;
import android.os.SystemClock;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.v7.app.ActionBarActivity;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.cnmc.painClinic.R;
import org.cnmc.painClinic.helper.propertiesReader;
import org.cnmc.painClinic.service.appInBackgroundService;
import org.cnmc.painClinic.service.invalidateService;
import org.cnmc.painClinic.service.painReportNotificationService;
import org.cnmc.painClinic.helper.jsHandler;

public class MainActivity extends ActionBarActivity {

//    private static int alarmIntervalInMins;
//    private static int minsToWaitInBackGround=15;
//    private boolean isAppVisible=true;
//    private propertiesReader propertiesReader;
//    private  BroadcastReceiver screenReciever;
    private Bundle webViewBundle;
    private static int DEFAULT_SAVE_STATE_TIME=4; //in hours
    private static int DEFAULT_REMINDER_INTERVAL=1; // in hours, used both for polling server for new surveys and reminding if app in background
    private static int PENDING_INTENT_ID_APPINBACKGROUNDSERVICE=0;
    private static int PENDING_INTENT_ID_INVALIDATESERVICE=1;
    private static int PENDING_INTENT_ID_PAINREPORTNOTIFICATIONSERVICE=2;
    private WebView webView;
    private jsHandler _jsHandler;
    private boolean firstPageFinishedLoading=false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        String URL = "file:///android_asset/www/index.html";
        int currentapiVersion = android.os.Build.VERSION.SDK_INT;

        webView = (WebView) findViewById(R.id.webView);
        webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);

        settings.setUserAgentString(
                this.webView.getSettings().getUserAgentString()
                        + " "
                        + "painreport"
        );

        //add javascript interface
        _jsHandler = new jsHandler(this, webView);
        webView.addJavascriptInterface(_jsHandler, "jsHandler");
        webView.addJavascriptInterface(this, "mainActivity");
        //In kitkat if hardware acceleration is not turned off
        //we get a blank screen on start of the app
        if (currentapiVersion == Build.VERSION_CODES.KITKAT) {
            webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        }
        //These settings are not available before Jelly Bean
        if (currentapiVersion >= Build.VERSION_CODES.JELLY_BEAN) {
            settings.setAllowContentAccess(true);
            settings.setAllowFileAccessFromFileURLs(true);
            settings.setAllowUniversalAccessFromFileURLs(true);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            webView.setWebContentsDebuggingEnabled(true);
        }
        //necessary for local storage to work
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT) {
            webView.getSettings().setDatabasePath("/data/data/" + webView.getContext().getPackageName() + "/databases/");
        }
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            private ProgressDialog progress;

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                progress = new ProgressDialog(MainActivity.this);
                progress.setMessage("Loading.. Please Wait!");
                progress.show();
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progress.dismiss();
                //this method gets called every time any page finishes loading
                //firstPageFinishedLoading will make sure to call the getPIN JavaScript
                //method only once
                if (!firstPageFinishedLoading) {
                    webView.loadUrl("javascript:getSettings()");
                    SharedPreferences sharedPrefs = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
                    if(sharedPrefs.getBoolean("Invalidated",false)){
                        webView.loadUrl("javascript:invalidateSurvey()");
                        webView.loadUrl("javascript:localStorage.surveyInProgress=-1");
                        webView.clearCache(true);
                        SharedPreferences.Editor editor=sharedPrefs.edit();
                        editor.putString("surveyInProgress", null);
                        editor.putBoolean("Invalidated",false);
                        editor.commit();
                    }
                    firstPageFinishedLoading = true;
                }
                super.onPageFinished(view, url);
            }
        });


        webView.loadUrl(URL);
    }

    @Override
    public void onBackPressed() {
        Toast.makeText(getApplicationContext(), "Sorry the back button is disabled",
                Toast.LENGTH_LONG).show();
    }
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_main, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {

            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    @Override
    public void onStop(){
        super.onStop();
        if(!hasWindowFocus()){
            SharedPreferences sharedPrefs = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
            SharedPreferences.Editor editor=sharedPrefs.edit();
            editor.putBoolean("AppInForeground",false);
            editor.commit();
            //int waitingTimeInMilli=minsToWaitInBackGround*60*1000;
            webView.loadUrl("javascript:checkSurveyInProgress()");
            String surveyInProgress=sharedPrefs.getString("surveyInProgress",null);
            if(surveyInProgress!=null) {
                int firstStrike = DEFAULT_REMINDER_INTERVAL*60*60*1000;
                int secondStrikeInHrs=sharedPrefs.getInt("saveStateTime",DEFAULT_SAVE_STATE_TIME);
                int secondStrikeInMilli=secondStrikeInHrs*60*60*1000;

                AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
                Intent i = new Intent(this, appInBackgroundService.class);

                PendingIntent pi = PendingIntent.getService(this, PENDING_INTENT_ID_APPINBACKGROUNDSERVICE, i, 0);
                am.setInexactRepeating(AlarmManager.ELAPSED_REALTIME_WAKEUP,
                        SystemClock.elapsedRealtime() + firstStrike,
                        firstStrike, pi);

                Intent invalidateServiceIntent = new Intent(this, invalidateService.class);

                PendingIntent invalidateIntent = PendingIntent.getService(this, PENDING_INTENT_ID_INVALIDATESERVICE, invalidateServiceIntent, 0);
                am.set(AlarmManager.RTC_WAKEUP, System.currentTimeMillis() + secondStrikeInMilli, invalidateIntent);
            }
        }
    }


    @Override
    public void onResume() {
        super.onResume();
        SharedPreferences sharedPrefs = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        SharedPreferences.Editor editor=sharedPrefs.edit();
        editor.putBoolean("AppInForeground",true);
        editor.commit();
        int alarmIntervalInHrs=sharedPrefs.getInt("reminderInterval",DEFAULT_REMINDER_INTERVAL);
        int alarmIntervalInMilli=alarmIntervalInHrs*60*60*1000;

        AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
        
        //cancel any alarms related to appInBackgroundService
        Intent appInBackgroundService = new Intent(this, appInBackgroundService.class);
        Intent invalidateServiceIntent=new Intent(this, invalidateService.class);

        PendingIntent piAppInBackgroundService = PendingIntent.getService(this,0, appInBackgroundService, 0);
        PendingIntent invalidateIntent = PendingIntent.getService(this, 1, invalidateServiceIntent, 0);
        am.cancel(piAppInBackgroundService);
        am.cancel(invalidateIntent);

        NotificationManager nMgr = (NotificationManager) getSystemService(getApplicationContext().NOTIFICATION_SERVICE);
        nMgr.cancelAll();

        
        //start the alarm for painReportNotificationService
        Intent i = new Intent(this, painReportNotificationService.class);
        PendingIntent pi = PendingIntent.getService(this, PENDING_INTENT_ID_PAINREPORTNOTIFICATIONSERVICE, i, 0);
        am.cancel(pi);

        am.setInexactRepeating(AlarmManager.ELAPSED_REALTIME_WAKEUP,
                SystemClock.elapsedRealtime() + alarmIntervalInMilli,
                alarmIntervalInMilli, pi);

    }
}