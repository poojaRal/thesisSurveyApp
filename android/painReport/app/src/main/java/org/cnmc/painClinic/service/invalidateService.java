package org.cnmc.painClinic.service;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.IBinder;
import android.preference.PreferenceManager;
import android.support.v4.app.NotificationCompat;

import org.cnmc.painClinic.R;
import org.cnmc.painClinic.painReport.MainActivity;

public class invalidateService extends Service {
    public invalidateService() {
    }
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        handleIntent(intent);
        return START_NOT_STICKY;
    }
    private void handleIntent(Intent intent) {
        SharedPreferences sharedPrefs = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        if(!sharedPrefs.getBoolean("AppInForeground",false)) {
            notifBuilder("Survey still pending", "Survey was invalidated, please take the survey again");
            AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
            Intent appInBackgroundServiceIntent = new Intent(getApplicationContext(), appInBackgroundService.class);
            PendingIntent appInBackgroundServicePI = PendingIntent.getService(getApplicationContext(), 0, appInBackgroundServiceIntent, 0);
            am.cancel(appInBackgroundServicePI);

            SharedPreferences.Editor editor = sharedPrefs.edit();
            editor.putBoolean("Invalidated", true);
            editor.commit();
        }
    }

        private void notifBuilder(String contentTitle,String contentText){
        int currentapiVersion = android.os.Build.VERSION.SDK_INT;
        int SERVER_DATA_RECEIVED = 1;
        Intent intent = new Intent(getApplicationContext(), MainActivity.class);
        //Notification.Builder is not available for API version <11 i.e HoneyComb
        //Else condition only applies to API level 10 i.e. Gingerbread
        if(currentapiVersion> Build.VERSION_CODES.GINGERBREAD){

            NotificationManager notificationManager =
                    (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

            PendingIntent pendingIntent = PendingIntent.getActivity(getApplicationContext(),
                    SERVER_DATA_RECEIVED, intent, PendingIntent.FLAG_UPDATE_CURRENT);
            Notification.Builder builder = new Notification.Builder(getApplicationContext())
                    .setSmallIcon(R.drawable.bearnotif)
                    .setLargeIcon(BitmapFactory.decodeResource(getResources(), R.drawable.ic_launcher))
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent)
                    .setContentTitle(contentTitle)
                    .setContentText(contentText);

            Notification notification=builder.getNotification();
            notificationManager.notify(SERVER_DATA_RECEIVED, notification);
        }
        else{
            PendingIntent pendingIntent = PendingIntent.getActivity(getApplicationContext(),
                    SERVER_DATA_RECEIVED, intent, PendingIntent.FLAG_UPDATE_CURRENT);
            Notification noti = new NotificationCompat.Builder(getApplicationContext())
                    .setSmallIcon(R.drawable.bearnotif)
                    .setLargeIcon(BitmapFactory.decodeResource(getResources(), R.drawable.ic_launcher))
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent)
                    .setContentTitle(contentTitle)
                    .setContentText(contentText)
                    .setAutoCancel(true).build();
        }
    }
    @Override
    public IBinder onBind(Intent intent) {
        // TODO: Return the communication channel to the service.
        throw new UnsupportedOperationException("Not yet implemented");
    }
}
